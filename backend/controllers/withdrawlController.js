const User = require('../models/User');
const WithdrawRequest = require('../models/withdrawRequest');
const { handleStripeOnboarding, createStripeTransfer } = require('./stripeContoroller');


const Freelancer = require('../models/Freelancer');
const UserProfile = require('../models/UserProfile');
const { withdrawFundsthroughPayPal, processPayPalWithdrawal } = require('./PaymentController');
const { sendWithdrawalStripeNotificationEmail, sendWithdrawalRejectionEmail, sendOnboardingEmail } = require('../services/emailService');

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

    const freelancer = await Freelancer.findOne({ userId });

    if (!freelancer) {
      return res.status(404).json({ success: false, message: 'Freelancer not found' });
    }

    if (freelancer.onboardingStatus !== 'completed') {
      return res.status(403).json({ success: false, message: 'Onboarding not completed' });
    }

    if (freelancer.availableBalance < 20) {
      return res.status(400).json({ success: false, message: 'Balance must be at least $20 to withdraw' });
    }

    if (amount > freelancer.availableBalance) {
      return res.status(400).json({ success: false, message: 'Insufficient balance for this amount' });
    }

    const withdrawRequest = new WithdrawRequest({
      userId,
      amount,
      withdrawalMethod: freelancer.withdrawalMethod,
    });

    await withdrawRequest.save();

    // Optional: Lock funds (subtract from availableBalance now)
    freelancer.availableBalance -= amount;
    await freelancer.save();

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
                await sendOnboardingEmail(email, userProfile.username, stripeResult.link);
                return res.status(200).json(stripeResult);
            }

            freelancer = stripeResult.freelancerAccount;
        } else if (withdrawalMethod === "paypal") {
            freelancer = await Freelancer.findOne({ userId });

            if (!freelancer) {
                return res.status(404).json({
                    success: false,
                    message: "Freelancer profile not found."
                });
            }

            freelancer.email = email;
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
        const withdrawRequests = await WithdrawRequest.find().sort({ createdAt: -1 });
        res.status(200).json(
            withdrawRequests
        );

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching withdraw requests',
            error: error.message,
        });
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

        if (withdrawalRequest.withdrawalMethod === 'stripe') {
            // Use the utility function for Stripe transfer
            const transfer = await createStripeTransfer(
                withdrawalRequest.amount * 100, // Convert to cents
                freelancer.stripeAccountId,
                `Payment for withdrawal request ID: ${withdrawalRequest._id}`
            );

            // Update the withdrawal request status to 'completed'
            withdrawalRequest.status = 'completed';
            await withdrawalRequest.save();

            // Note: Balance was already subtracted in handleWithdrawalRequest (line 129)
            // so we don't subtract it again here to avoid double deduction.

            return res.status(200).json({
                success: true,
                message: 'Funds transferred successfully via Stripe.',
                transfer,
            });
        } else if (withdrawalRequest.withdrawalMethod === 'paypal') {
            const result = await processPayPalWithdrawal(freelancer.email, withdrawalRequest.amount);
            if (!result.success) {
                return res.status(500).json({ error: result.message });
            }

            withdrawalRequest.status = 'completed';
            await withdrawalRequest.save();

            // Note: Balance was already subtracted in handleWithdrawalRequest (line 129)

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

        const freelancer = await Freelancer.findOne({ userId }).select('_id onboardingStatus availableBalance email withdrawalMethod');


        // if (!withdrawRequests.length) {
        //     return res.status(404).json({ message: "No withdrawal requests found." });
        // }

        res.status(200).json({
            accountDetails: {
                id : freelancer._id,
                availableBalance: freelancer.availableBalance,
                email: freelancer.email,
                withdrawalMethod: freelancer.withdrawalMethod,
                onboardingStatus : freelancer.onboardingStatus
            },
            withdrawRequests
        });
    } catch (error) {
        console.error("Error fetching withdrawal requests:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


module.exports = { handleWithdrawalRequest, approveWithdrawRequest, getAllWithdrawRequests, rejectWithdrawRequest, getUserWithdrawalRequest, setWithdrawalMethod }