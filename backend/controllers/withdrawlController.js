const User = require('../models/User');
const WithdrawRequest = require('../models/withdrawRequest');
const { handleStripeOnboarding, createStripeTransfer } = require('./stripeContoroller');

const Freelancer = require('../models/Freelancer');
const UserProfile = require('../models/UserProfile');
const { withdrawFundsthroughPayPal, processPayPalWithdrawal } = require('./PaymentController');
const { sendWithdrawalStripeNotificationEmail, sendWithdrawalRejectionEmail, sendOnboardingEmail } = require('../services/emailService');
const { notifyWithdrawalRequestSubmitted } = require('../services/notificationService');

const computeAvailableForWithdrawal = ({ user, freelancer }) => {
    const freelancerAvailable = Math.max(
        freelancer?.revenue?.available ?? 0,
        freelancer?.availableBalance ?? 0
    );
    const userAvailable = user?.revenue?.available ?? 0;
    return Math.max(freelancerAvailable, userAvailable);
};

// const handleWithdrawalRequest = async (req, res) => {
//     const { email, amount, withdrawalMethod } = req.body;
//     const { userId } = req;

//     if (!userId) {
//         return res.status(400).json({ message: "You are not allowed to do so!" });
//     }

//     try {
//         // Fetch user profile and validate country
//         const userProfile = await UserProfile.findOne({ userId });

//         if (!userProfile) {
//             return res.status(400).json({
//                 success: false,
//                 message: "User profile not found."
//             });
//         }

//         if (!userProfile.countryCode) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Country information is required."
//             });
//         }

//         const countryCode = userProfile.countryCode;

//         if (withdrawalMethod === "stripe") {
//             // Handle Stripe onboarding and validation
//             const stripeResult = await handleStripeOnboarding(userId, email, countryCode);

//             if (!stripeResult.success) {
//                 await sendOnboardingEmail(email, userProfile.username, stripeResult.link);
//                 return res.status(200).json(stripeResult);
//             }

//             const { freelancerAccount } = stripeResult;

//             // Validate available balance for Stripe
//             if (!freelancerAccount || freelancerAccount.availableBalance < amount || amount <= 0) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Invalid or Insufficient funds."
//                 });
//             }
//         } else if (withdrawalMethod === "paypal") {
//             const freelancer = await Freelancer.findOne({ userId });

//             if (!freelancer) {
//                 return res.status(404).json({
//                     success: false,
//                     message: "Freelancer profile not found."
//                 });
//             }

//             freelancer.email = email;
//             await freelancer.save();
//         }

//         // Create and save withdrawal request
//         const withdrawalRequest = new WithdrawRequest({
//             userId, // Directly use userId instead of user._id
//             amount,
//             withdrawalMethod,
//             status: "pending",
//             createdAt: new Date(),
//         });

//         await withdrawalRequest.save();

//         res.status(200).json({
//             success: true,
//             message: "Withdrawal request submitted successfully.",
//             request: withdrawalRequest,
//         });
//     } catch (error) {
//         console.error("Error in withdrawal request:", error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// };

const handleWithdrawalRequest = async (req, res) => {
  try {
    const { userId } = req; // Assuming userId is added by auth middleware
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

        const user = await User.findById(userId).select('_id email revenue');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let freelancer = await Freelancer.findOne({ userId });

        // Some accounts store balances on User.revenue and may not yet have a Freelancer doc.
        // Create a minimal Freelancer record so withdrawals can proceed.
        if (!freelancer) {
            freelancer = new Freelancer({
                userId,
                email: user.email,
                withdrawalMethod: 'paypal',
                onboardingStatus: 'completed',
            });

            freelancer.revenue = freelancer.revenue || { total: 0, pending: 0, available: 0, withdrawn: 0, inTransit: 0 };
            freelancer.revenue.available = user?.revenue?.available ?? 0;
            freelancer.availableBalance = freelancer.revenue.available;
            await freelancer.save();
        }

        // Only Stripe requires Connect onboarding. PayPal can proceed once the method is set.
        if (freelancer.withdrawalMethod === 'stripe' && freelancer.onboardingStatus !== 'completed') {
            return res.status(403).json({ success: false, message: 'Onboarding not completed' });
        }

                const available = computeAvailableForWithdrawal({ user, freelancer });

        if (available < 20) {
      return res.status(400).json({ success: false, message: 'Balance must be at least $20 to withdraw' });
    }

        if (amount > available) {
      return res.status(400).json({ success: false, message: 'Insufficient balance for this amount' });
    }

        // Prevent multiple pending withdrawals (avoids oversubscription)
        const existingPending = await WithdrawRequest.findOne({ userId, status: 'pending' });
        if (existingPending) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending withdrawal request'
            });
        }

    const withdrawRequest = new WithdrawRequest({
      userId,
      amount,
      withdrawalMethod: freelancer.withdrawalMethod,
    });

    await withdrawRequest.save();

    // Notify all admins about the new withdrawal request
    try {
      const adminUsers = await User.find({ role: 'admin' }).select('_id');
      const adminIds = adminUsers.map(a => a._id.toString());
      if (adminIds.length > 0) {
        await notifyWithdrawalRequestSubmitted(adminIds, userId, amount, withdrawRequest._id.toString());
      }
    } catch (notificationError) {
      console.error('Failed to notify admins about withdrawal request:', notificationError);
      // Don't fail the request if notification fails
    }

    // Do NOT deduct funds on request; deduct on admin approval.

    res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawRequest,
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const setWithdrawalMethod = async (req, res) => {
    const { email, withdrawalMethod } = req.body;
    const { userId } = req;

    if (!userId) {
        return res.status(400).json({ message: "You are not allowed to do so!" });
    }

    try {
        // Fetch user profile and validate country
        const userProfile = await UserProfile.findOne({ userId });

        if (!userProfile) {
            return res.status(400).json({
                success: false,
                message: "User profile not found."
            });
        }

        if (!userProfile.countryCode) {
            return res.status(400).json({
                success: false,
                message: "Country information is required."
            });
        }

        const countryCode = userProfile.countryCode;
        let freelancer = null;

        if (withdrawalMethod === "stripe") {
            // Handle Stripe onboarding and validation
            const stripeResult = await handleStripeOnboarding(userId, email, countryCode);

            if (!stripeResult.success) {
                // Only send onboarding email if Stripe provided an onboarding link
                if (stripeResult.link) {
                    await sendOnboardingEmail(email, userProfile.username, stripeResult.link);
                }
                return res.status(200).json(stripeResult);
            }

            freelancer = stripeResult.freelancerAccount;
        } else if (withdrawalMethod === "paypal") {
            freelancer = await Freelancer.findOne({ userId });
            if (!freelancer) {
                freelancer = new Freelancer({
                    userId,
                    email,
                    withdrawalMethod: 'paypal',
                    onboardingStatus: 'completed', // PayPal doesn't require Stripe Connect onboarding
                });
            } else {
                freelancer.email = email;
                freelancer.withdrawalMethod = 'paypal';
                freelancer.onboardingStatus = 'completed';
            }

            // Sync available from User.revenue if needed
            const user = await User.findById(userId).select('_id revenue');
            const available = computeAvailableForWithdrawal({ user, freelancer });
            freelancer.revenue = freelancer.revenue || { total: 0, pending: 0, available: 0, withdrawn: 0, inTransit: 0 };
            freelancer.revenue.available = Math.max(freelancer.revenue.available || 0, available);
            freelancer.availableBalance = freelancer.revenue.available;

            await freelancer.save();
        }

        res.status(200).json({
            success: true,
            message: "Your account updated successfully!",
            freelancer
        });
    } catch (error) {
        console.error("Error in withdrawal request:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getAllWithdrawRequests = async (req, res) => {
    try {
        const { status, limit } = req.query;

        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        let withdrawRequestsQuery = WithdrawRequest.find(query)
            .sort({ createdAt: -1 })
            .populate('userId', 'username fullName email');

        const parsedLimit = Number(limit);
        if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
            withdrawRequestsQuery = withdrawRequestsQuery.limit(parsedLimit);
        }

        const withdrawRequests = await withdrawRequestsQuery;

        // Attach withdrawal method (if available) + flatten username for the admin table
        const userIds = withdrawRequests
            .map((wr) => (wr.userId && typeof wr.userId === 'object' ? wr.userId._id : wr.userId))
            .filter(Boolean);

        const freelancers = await Freelancer.find({ userId: { $in: userIds } })
            .select('userId withdrawalMethod')
            .lean();

        const methodByUserId = new Map(
            freelancers.map((f) => [String(f.userId), f.withdrawalMethod])
        );

        const response = withdrawRequests.map((wr) => {
            const obj = wr.toObject();
            const userDoc = obj.userId;
            const flattenedUserId = userDoc && typeof userDoc === 'object' ? userDoc._id : userDoc;

            return {
                ...obj,
                userId: flattenedUserId,
                username:
                    (userDoc && typeof userDoc === 'object' && (userDoc.username || userDoc.fullName || userDoc.email))
                        ? (userDoc.username || userDoc.fullName || userDoc.email)
                        : undefined,
                withdrawalMethod: methodByUserId.get(String(flattenedUserId)) || obj.withdrawalMethod,
            };
        });

        res.status(200).json(response);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching withdraw requests',
            error: error.message,
        });
    }
};

const getWithdrawRequestDetail = async (req, res) => {
    try {
        const { requestId } = req.params;
        if (!requestId) {
            return res.status(400).json({ success: false, message: 'Request ID is required' });
        }

        const withdrawRequest = await WithdrawRequest.findById(requestId)
            .populate('userId', 'username fullName email')
            .lean();

        if (!withdrawRequest) {
            return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
        }

        const userDoc = withdrawRequest.userId;
        const flattenedUserId = userDoc && typeof userDoc === 'object' ? userDoc._id : withdrawRequest.userId;

        const freelancer = await Freelancer.findOne({ userId: flattenedUserId })
            .select('withdrawalMethod email')
            .lean();

        const withdrawalMethod = freelancer?.withdrawalMethod;
        const payoutEmail = freelancer?.email;

        return res.status(200).json({
            ...withdrawRequest,
            userId: flattenedUserId,
            user: userDoc && typeof userDoc === 'object' ? userDoc : undefined,
            username:
                userDoc && typeof userDoc === 'object'
                    ? (userDoc.username || userDoc.fullName || userDoc.email)
                    : undefined,
            email: userDoc && typeof userDoc === 'object' ? userDoc.email : undefined,
            withdrawalMethod,
            payoutEmail,
        });
    } catch (error) {
        console.error('Error fetching withdrawal request detail:', error);
        return res.status(500).json({ success: false, message: 'Error fetching withdrawal request detail', error: error.message });
    }
};

const rejectWithdrawRequest = async (req, res) => {
    try {
        const { requestId, reason } = req.body;

        if (!requestId || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Request ID and reason are required!',
            });
        }

        const withdrawRequest = await WithdrawRequest.findById(requestId).populate('userId', 'email');

        if (!withdrawRequest) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found.',
            });
        }

        withdrawRequest.status = 'rejected';
        await withdrawRequest.save();

        const email = withdrawRequest.userId.email;

        await sendWithdrawalRejectionEmail(email, reason);

        res.status(200).json({
            success: true,
            message: 'Withdrawal request rejected and email sent to the user.',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error rejecting withdrawal request.',
            error: error.message,
        });
    }
};

const approveWithdrawRequest = async (req, res) => {
    const { requestId } = req.body;

    try {
        // Find the withdrawal request by its _id
        const withdrawalRequest = await WithdrawRequest.findOne({ _id: requestId, status: 'pending' });

        if (!withdrawalRequest) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found or already processed.',
            });
        }

        // Find the freelancer associated with the withdrawal request
        const freelancer = await Freelancer.findOne({ userId: withdrawalRequest.userId });

        if (!freelancer) {
            return res.status(404).json({ success: false, message: 'Freelancer not found.' });
        }

                const available = Math.max(
                    freelancer?.revenue?.available ?? 0,
                    freelancer?.availableBalance ?? 0
                );

                if (available < withdrawalRequest.amount) {
                    return res.status(400).json({
                        success: false,
                        message: 'Insufficient available balance to approve this withdrawal.'
                    });
                }

        // Track if the method was explicitly set on the request (vs inferred from freelancer profile)
        const storedMethodOnRequest = withdrawalRequest.withdrawalMethod;
        let method = String(storedMethodOnRequest || freelancer.withdrawalMethod || '').toLowerCase();

        // Log for debugging
        console.log('[Withdrawal Approval] Request ID:', requestId);
        console.log('[Withdrawal Approval] Freelancer:', { 
            id: freelancer._id, 
            userId: freelancer.userId,
            withdrawalMethod: freelancer.withdrawalMethod, 
            stripeAccountId: freelancer.stripeAccountId,
            email: freelancer.email 
        });
        console.log('[Withdrawal Approval] Stored method on request:', storedMethodOnRequest);
        console.log('[Withdrawal Approval] Inferred method:', method);

        // Persist inferred method for older records
        if (!storedMethodOnRequest && method) {
            withdrawalRequest.withdrawalMethod = method;
        }

        // Handle Stripe method when stripeAccountId is missing
        if (method === 'stripe' && !freelancer.stripeAccountId) {
            // If method was EXPLICITLY stored on the request as 'stripe', user chose it deliberately
            // In this case, reject with clear message - don't silently fallback
            if (storedMethodOnRequest === 'stripe') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot process Stripe withdrawal: The freelancer has not completed Stripe onboarding. Please ask them to complete Stripe setup in their payout settings, or reject this request and have them submit a new one with PayPal.'
                });
            }
            
            // If method was inferred (not explicitly stored), allow fallback to PayPal
            const fallbackEmail = freelancer.email || withdrawalRequest.payoutEmail;
            if (fallbackEmail) {
                console.log('[Withdrawal Approval] Stripe not configured (inferred method), falling back to PayPal for:', fallbackEmail);
                method = 'paypal';
                withdrawalRequest.withdrawalMethod = 'paypal';
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Stripe account is not configured and no PayPal email available for fallback.'
                });
            }
        }

        if (method === 'stripe') {
            // Use the utility function for Stripe transfer
            const transfer = await createStripeTransfer(
                withdrawalRequest.amount * 100, // Convert to cents
                freelancer.stripeAccountId,
                `Payment for withdrawal request ID: ${withdrawalRequest._id}`
            );

            // Update the withdrawal request status to 'completed'
            withdrawalRequest.status = 'completed';
            await withdrawalRequest.save();

            // Deduct funds on approval (so seller balance changes when request is accepted)
            freelancer.revenue = freelancer.revenue || { total: 0, pending: 0, available: 0, withdrawn: 0, inTransit: 0 };
            freelancer.revenue.available = Math.max(0, (freelancer.revenue.available || 0) - withdrawalRequest.amount);
            freelancer.revenue.withdrawn = (freelancer.revenue.withdrawn || 0) + withdrawalRequest.amount;
            freelancer.availableBalance = freelancer.revenue.available;
            await freelancer.save();

            return res.status(200).json({
                success: true,
                message: 'Funds transferred successfully via Stripe.',
                transfer,
            });
        } else if (method === 'paypal') {
            const payoutEmail = freelancer.email || withdrawalRequest.payoutEmail;
            const result = await processPayPalWithdrawal(payoutEmail, withdrawalRequest.amount);
            if (!result.success) {
                // Return proper error status based on PayPal error type
                const statusCode = result.error?.includes('INSUFFICIENT_FUNDS') ? 402 : 422;
                return res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: result.error,
                    paypalError: true
                });
            }

            withdrawalRequest.status = 'approved';
            await withdrawalRequest.save();

            // Deduct funds on approval (so seller balance changes when request is accepted)
            freelancer.revenue = freelancer.revenue || { total: 0, pending: 0, available: 0, withdrawn: 0, inTransit: 0 };
            freelancer.revenue.available = Math.max(0, (freelancer.revenue.available || 0) - withdrawalRequest.amount);
            freelancer.revenue.withdrawn = (freelancer.revenue.withdrawn || 0) + withdrawalRequest.amount;
            freelancer.availableBalance = freelancer.revenue.available;
            await freelancer.save();

            return res.status(200).json({
                success: true,
                message: 'Funds transferred successfully via PayPal.',
                result
            });

        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid withdrawal method.',
            });
        }
    } catch (error) {
        console.error('Error approving withdrawal request:', error);
        res.status(500).json({ success: false, message: 'Failed to approve withdrawal request.' });
    }
};

const getUserWithdrawalRequest = async (req, res) => {
    try {
        const { userId } = req;

        if (!userId) {
            return res.status(401).json({ error: "You are not authenticated!" });
        }

        const withdrawRequests = await WithdrawRequest.find({ userId });

        const [freelancer, user] = await Promise.all([
            Freelancer.findOne({ userId }).select('_id onboardingStatus availableBalance revenue email withdrawalMethod'),
            User.findById(userId).select('_id email revenue')
        ]);

        const availableBalance = computeAvailableForWithdrawal({ user, freelancer });

        // if (!withdrawRequests.length) {
        //     return res.status(404).json({ message: "No withdrawal requests found." });
        // }

        res.status(200).json({
            accountDetails: {
                id: freelancer?._id || user?._id || userId,
                availableBalance,
                email: freelancer?.email || user?.email || '',
                withdrawalMethod: freelancer?.withdrawalMethod || 'paypal',
                onboardingStatus: freelancer?.onboardingStatus || 'not_started'
            },
            withdrawRequests
        });
    } catch (error) {
        console.error("Error fetching withdrawal requests:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { handleWithdrawalRequest, approveWithdrawRequest, getAllWithdrawRequests, getWithdrawRequestDetail, rejectWithdrawRequest, getUserWithdrawalRequest, setWithdrawalMethod }