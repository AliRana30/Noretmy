const User = require('../models/User');
const WithdrawRequest = require('../models/withdrawRequest');
const { handleStripeOnboarding, createStripeTransfer } = require('./stripeContoroller');

const Freelancer = require('../models/Freelancer');
const UserProfile = require('../models/UserProfile');
const { withdrawFundsthroughPayPal, processPayPalWithdrawal } = require('./PaymentController');
const { sendWithdrawalStripeNotificationEmail, sendWithdrawalSuccessEmail, sendWithdrawalRejectionEmail, sendOnboardingEmail } = require('../services/emailService');
const { notifyWithdrawalRequestSubmitted, notifyWithdrawalApproved, notifyWithdrawalRejected } = require('../services/notificationService');

const computeAvailableForWithdrawal = ({ user, freelancer }) => {
    const freelancerAvailable = Math.max(
        freelancer?.revenue?.available ?? 0,
        freelancer?.availableBalance ?? 0
    );
    const userAvailable = user?.revenue?.available ?? 0;
    return Math.max(freelancerAvailable, userAvailable);
};
















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
            payoutEmail: freelancer.email || user.email,
        });

    await withdrawRequest.save();

    try {
    const adminUsers = await User.find({ role: { $regex: /^admin$/i } }).select('_id');
      const adminIds = adminUsers.map(a => a._id.toString());
      if (adminIds.length > 0) {
        await notifyWithdrawalRequestSubmitted(adminIds, userId, amount, withdrawRequest._id.toString());
      }
    } catch (notificationError) {
      console.error('Failed to notify admins about withdrawal request:', notificationError);
    }


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

    console.log('[setWithdrawalMethod] Request:', { userId, email, withdrawalMethod });

    if (!userId) {
        return res.status(400).json({ message: "You are not allowed to do so!" });
    }

    try {
        const userProfile = await UserProfile.findOne({ userId });

        if (!userProfile) {
            console.log('[setWithdrawalMethod] User profile not found for:', userId);
            return res.status(400).json({
                success: false,
                message: "User profile not found."
            });
        }

        if (!userProfile.countryCode) {
            console.log('[setWithdrawalMethod] Country code missing for:', userId);
            return res.status(400).json({
                success: false,
                message: "Country information is required."
            });
        }

        const countryCode = userProfile.countryCode;
        let freelancer = null;

        if (withdrawalMethod === "stripe") {
            console.log('[setWithdrawalMethod] Processing Stripe for:', { userId, email, countryCode });
            const stripeResult = await handleStripeOnboarding(userId, email, countryCode);

            console.log('[setWithdrawalMethod] Stripe result:', { success: stripeResult.success, hasLink: !!stripeResult.link, message: stripeResult.message });

            if (!stripeResult.success) {
                if (stripeResult.link) {
                    await sendOnboardingEmail(email, userProfile.username, stripeResult.link);
                }
                return res.status(200).json(stripeResult);
            }

            freelancer = stripeResult.freelancerAccount;
        } else if (withdrawalMethod === "paypal") {
            console.log('[setWithdrawalMethod] Processing PayPal for:', { userId, email });
            freelancer = await Freelancer.findOne({ userId });
            if (!freelancer) {
                freelancer = new Freelancer({
                    userId,
                    email,
                    withdrawalMethod: 'paypal',
                    onboardingStatus: 'completed', // PayPal doesn't require Stripe Connect onboarding
                });
                console.log('[setWithdrawalMethod] Created new Freelancer for PayPal');
            } else {
                freelancer.email = email;
                freelancer.withdrawalMethod = 'paypal';
                freelancer.onboardingStatus = 'completed';
                console.log('[setWithdrawalMethod] Updated existing Freelancer for PayPal');
            }

            const user = await User.findById(userId).select('_id revenue');
            const available = computeAvailableForWithdrawal({ user, freelancer });
            freelancer.revenue = freelancer.revenue || { total: 0, pending: 0, available: 0, withdrawn: 0, inTransit: 0 };
            freelancer.revenue.available = Math.max(freelancer.revenue.available || 0, available);
            freelancer.availableBalance = freelancer.revenue.available;

            await freelancer.save();
            console.log('[setWithdrawalMethod] PayPal freelancer saved:', freelancer._id);
        }

        console.log('[setWithdrawalMethod] Returning freelancer:', { id: freelancer?._id, email: freelancer?.email, method: freelancer?.withdrawalMethod });

        res.status(200).json({
            success: true,
            message: "Your account updated successfully!",
            freelancer
        });
    } catch (error) {
        console.error("[setWithdrawalMethod] Error:", error);
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
            .select('withdrawalMethod email stripeAccountId onboardingStatus')
            .lean();

        const withdrawalMethod = withdrawRequest.withdrawalMethod || freelancer?.withdrawalMethod || null;
        const payoutEmail = withdrawRequest.payoutEmail || freelancer?.email || (userDoc && typeof userDoc === 'object' ? userDoc.email : null) || null;
        const stripeAccountId = freelancer?.stripeAccountId || null;
        const onboardingStatus = freelancer?.onboardingStatus || null;

        let userEmail = userDoc && typeof userDoc === 'object' ? userDoc.email : null;
        if (!userEmail && flattenedUserId) {
            const user = await User.findById(flattenedUserId).select('email username fullName').lean();
            if (user?.email) userEmail = user.email;
        }

        console.log('[Withdrawal Detail] Response:', {
            requestId,
            userId: flattenedUserId,
            email: userEmail,
            withdrawalMethod,
            payoutEmail,
            stripeAccountId,
            onboardingStatus,
            user: userDoc ? { username: userDoc.username, email: userDoc.email } : null
        });

        return res.status(200).json({
            success: true,
            ...withdrawRequest,
            userId: flattenedUserId,
            user: userDoc && typeof userDoc === 'object' ? userDoc : null,
            username:
                userDoc && typeof userDoc === 'object'
                    ? (userDoc.username || userDoc.fullName || userDoc.email)
                    : null,
            email: userEmail || null,
            withdrawalMethod: withdrawalMethod || null,
            payoutEmail: payoutEmail || null,
            stripeAccountId: stripeAccountId || null,
            onboardingStatus: onboardingStatus || null,
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

        const email = withdrawRequest.userId?.email;

        if (email) {
            await sendWithdrawalRejectionEmail(email, reason);
        }

        try {
            const targetUserId = (withdrawRequest.userId && typeof withdrawRequest.userId === 'object')
                ? String(withdrawRequest.userId._id)
                : String(withdrawRequest.userId);
            await notifyWithdrawalRejected(targetUserId, withdrawRequest.amount, String(withdrawRequest._id), reason);
        } catch (notifErr) {
            console.error('Failed to create/emit withdrawal rejected notification:', notifErr?.message || notifErr);
        }

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
    const requestId = req?.params?.requestId || req?.body?.requestId;
    const adminNote = req?.body?.adminNote;

    try {
        if (!requestId) {
            return res.status(400).json({ success: false, message: 'Request ID is required.' });
        }

        const withdrawalRequest = await WithdrawRequest.findOne({ _id: requestId, status: 'pending' });

        if (!withdrawalRequest) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found or already processed.',
            });
        }

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

        let method = String(freelancer.withdrawalMethod || '').toLowerCase();
        
        if (!method) {
            const storedMethodOnRequest = withdrawalRequest.withdrawalMethod;
            method = String(storedMethodOnRequest || '').toLowerCase();
        }

        console.log('[Withdrawal Approval] Request ID:', requestId);
        console.log('[Withdrawal Approval] Freelancer:', { 
            id: freelancer._id, 
            userId: freelancer.userId,
            withdrawalMethod: freelancer.withdrawalMethod, 
            stripeAccountId: freelancer.stripeAccountId,
            email: freelancer.email 
        });
        console.log('[Withdrawal Approval] Using method:', method);

        withdrawalRequest.withdrawalMethod = method;

        if (method === 'stripe' && !freelancer.stripeAccountId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot process Stripe withdrawal: The freelancer has not completed Stripe onboarding. Please ask them to complete Stripe setup in their payout settings.'
            });
        }

        if (method === 'stripe') {
            if (!process.env.STRIPE_SECRET_KEY) {
                return res.status(503).json({
                    success: false,
                    message: 'Stripe is not configured on the server (missing STRIPE_SECRET_KEY).'
                });
            }
            let transfer;
            try {
                transfer = await createStripeTransfer(
                    withdrawalRequest.amount * 100, // Convert to cents
                    freelancer.stripeAccountId,
                    `Payment for withdrawal request ID: ${withdrawalRequest._id}`
                );
                
                console.log('✅ [Withdrawal Approval] Stripe transfer successful:', {
                    transferId: transfer.id,
                    amount: withdrawalRequest.amount,
                    requestId: withdrawalRequest._id
                });
            } catch (stripeErr) {
                console.error('❌ [Withdrawal Approval] Stripe transfer failed:', stripeErr?.message);
                return res.status(502).json({
                    success: false,
                    message: stripeErr?.message || 'Failed to process the Stripe transfer.'
                });
            }

            withdrawalRequest.status = 'approved';
            await withdrawalRequest.save();

            freelancer.revenue = freelancer.revenue || { total: 0, pending: 0, available: 0, withdrawn: 0, inTransit: 0 };
            freelancer.revenue.available = Math.max(0, (freelancer.revenue.available || 0) - withdrawalRequest.amount);
            freelancer.revenue.withdrawn = (freelancer.revenue.withdrawn || 0) + withdrawalRequest.amount;
            freelancer.availableBalance = freelancer.revenue.available;
            await freelancer.save();

            try {
                const user = await User.findById(withdrawalRequest.userId).select('_id email revenue');
                if (user) {
                    user.revenue = user.revenue || { total: 0, pending: 0, available: 0, withdrawn: 0, inTransit: 0 };
                    user.revenue.available = Math.max(0, (user.revenue.available || 0) - withdrawalRequest.amount);
                    user.revenue.withdrawn = (user.revenue.withdrawn || 0) + withdrawalRequest.amount;
                    await user.save();

                    if (user.email) {
                        await sendWithdrawalSuccessEmail(user.email, withdrawalRequest.amount);
                    }

                    await notifyWithdrawalApproved(String(user._id), withdrawalRequest.amount, String(withdrawalRequest._id));
                }
            } catch (sideErr) {
                console.warn('⚠️ [Withdrawal Approval] Side-effects failed (email/notification), but withdrawal approved:', sideErr?.message || sideErr);
            }

            console.log('✅ [Withdrawal Approval] Complete - returning success response');
            return res.status(200).json({
                success: true,
                message: 'Withdrawal approved successfully! Funds transferred via Stripe.',
                transfer,
            });
        } else if (method === 'paypal') {
            const payoutEmail = freelancer.email || withdrawalRequest.payoutEmail;
            if (!payoutEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'PayPal email is not configured for this freelancer.'
                });
            }

            withdrawalRequest.payoutEmail = payoutEmail;

            const result = await processPayPalWithdrawal(payoutEmail, withdrawalRequest.amount);
            if (!result.success) {
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

            freelancer.revenue = freelancer.revenue || { total: 0, pending: 0, available: 0, withdrawn: 0, inTransit: 0 };
            freelancer.revenue.available = Math.max(0, (freelancer.revenue.available || 0) - withdrawalRequest.amount);
            freelancer.revenue.withdrawn = (freelancer.revenue.withdrawn || 0) + withdrawalRequest.amount;
            freelancer.availableBalance = freelancer.revenue.available;
            await freelancer.save();

            try {
                const user = await User.findById(withdrawalRequest.userId).select('_id email revenue');
                if (user) {
                    user.revenue = user.revenue || { total: 0, pending: 0, available: 0, withdrawn: 0, inTransit: 0 };
                    user.revenue.available = Math.max(0, (user.revenue.available || 0) - withdrawalRequest.amount);
                    user.revenue.withdrawn = (user.revenue.withdrawn || 0) + withdrawalRequest.amount;
                    await user.save();

                    if (user.email) {
                        await sendWithdrawalSuccessEmail(user.email, withdrawalRequest.amount);
                    }

                    await notifyWithdrawalApproved(String(user._id), withdrawalRequest.amount, String(withdrawalRequest._id));
                }
            } catch (sideErr) {
                console.error('Post-approval side-effects (user sync/email/notification) failed:', sideErr?.message || sideErr);
            }

            return res.status(200).json({
                success: true,
                message: 'Funds transferred successfully via PayPal.',
                result
            });

        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid withdrawal method.',
                method: withdrawalRequest.withdrawalMethod || freelancer.withdrawalMethod || null,
            });
        }
    } catch (error) {
        console.error('Error approving withdrawal request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve withdrawal request.',
            error: error?.message || String(error)
        });
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