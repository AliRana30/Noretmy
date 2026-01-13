

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypalCheckout = require('@paypal/checkout-server-sdk');
const paypalRestSdk = require('paypal-rest-sdk');

// Configure PayPal REST SDK for payouts
paypalRestSdk.configure({
    'mode': process.env.PAYPAL_MODE || 'sandbox', // 'sandbox' or 'live'
    'client_id': process.env.PAYPAL_CLIENT_ID,
    'client_secret': process.env.PAYPAL_SECRET // Note: uses PAYPAL_SECRET from .env
});

const Freelancer = require('../models/Freelancer');
const Order = require('../models/Order'); 
const User = require('../models/User');

const bodyParser = require('body-parser');
const { sendUserNotificationEmail, sendOrderSuccessEmail,sendSellerOrderNotificationEmail, sendPromotionPlanEmail, sendAllGigsPromotionEmail } = require('../services/emailService');
const Job = require('../models/Job');
const Promotion = require('../models/Promotion'); // Legacy - kept for reference
const PromotionPurchase = require('../models/PromotionPurchase'); // New: Single source of truth
const { PROMOTION_PLANS, getPlan } = require('../utils/promotionPlans');
const notificationService = require('../services/notificationService');
const mongoose = require('mongoose');

exports.createCustomerAndPaymentIntent = async (req, res) => {
  const { amount, email } = req.body;

  // Validate the inputs
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    // Check if the customer already exists (optional step)
    let customer = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (customer.data.length > 0) {
      // If customer exists, use the existing customer
      customer = customer.data[0];
    } else {
      // Otherwise, create a new customer
      customer = await stripe.customers.create({
        email,
      });
    }

    // Create a Payment Intent linked to the customer
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customer.id,
      payment_method_types: ['card'],
    });

    res.status(200).json({
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating customer and payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

exports.createCustomerAndPaymentIntentUtil = async (amount, email, paymentType, additionalData) => {
  // Support both (amount, email, ...) signature and ({ amount, email, ... }) signature
  let orderId = null;
  let isMilestone = false;
  
  if (typeof amount === 'object') {
    const params = amount;
    email = params.email;
    paymentType = params.paymentType;
    additionalData = params.additionalData;
    amount = params.amount;
  }

  if (additionalData && (additionalData.isMilestone || (additionalData.orderId && additionalData.orderId.isMilestone))) {
     isMilestone = true;
  }
  // Check if orderId implies milestone (if passed as string but we can't check db here easily)
  // Assuming additionalData passed from controller has the flag

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    throw new Error('Invalid amount');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email');
  }

  // To get Metadata about payment
  const metadata = setupPaymentMetadata(paymentType, additionalData);
  if (isMilestone) {
    metadata.milestoneEnabled = 'true';
  }

  try {

    const totalAmountInCents = Math.round(amount * 100);

    // Check if the customer already exists (optional step)
    let customer = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customer.data.length > 0) {
      // If customer exists, use the existing customer
      customer = customer.data[0];
    } else {
      // Otherwise, create a new customer
      customer = await stripe.customers.create({
        email,
      });
    }

    const intentParams = {
      amount: totalAmountInCents,  // Amount in cents
      currency: 'usd',
      customer: customer.id,
      payment_method_types: ['card'],
      metadata,
    };

    // Use manual capture for ALL order payments to enable milestone-based captures (10%, 50%, 20%, 20%)
    // This allows us to authorize the full amount but only capture portions as the order progresses
    if (paymentType === 'order_payment') {
      intentParams.capture_method = 'manual';
      metadata.milestoneEnabled = 'true';
    }

    // Create a Payment Intent linked to the customer
    const paymentIntent = await stripe.paymentIntents.create(intentParams);

    console.log('\n========== PAYMENT INTENT CREATED ==========');
    console.log('Payment Intent ID:', paymentIntent.id);
    console.log('Amount:', paymentIntent.amount / 100);
    console.log('Payment Type:', metadata.paymentType);
    console.log('Metadata:', JSON.stringify(metadata, null, 2));
    console.log('==========================================\n');

    return { 
      payment_intent: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
    };
    
  } catch (error) {
    console.error('Error creating customer and payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
};

const setupPaymentMetadata = (paymentType, additionalData) => {
  const metadata = { paymentType };

  if (paymentType === 'order_payment') {
    metadata.orderId = additionalData.orderId;
    metadata.userId = additionalData.userId;
    metadata.vatRate=additionalData.vatRate;
    additionalData.discount > 0 ? (metadata.discount = additionalData.discount) : null;
  } else if (paymentType === 'gig_promotion') {
    metadata.gigId = additionalData.gigId;
    metadata.userId = additionalData.userId;
    metadata.promotionPlan = additionalData.promotionPlan;
    metadata.vatRate = String(additionalData.vatRate || 0);
    metadata.baseAmount = String(additionalData.baseAmount || 0);
    metadata.vatAmount = String(additionalData.vatAmount || 0);
    metadata.platformFee = String(additionalData.platformFee || 0);
  } else if (paymentType === 'monthly_promotion') {
    metadata.userId = additionalData.userId;
    metadata.promotionPlan = additionalData.promotionPlan;
    metadata.vatRate = String(additionalData.vatRate || 0);
    metadata.baseAmount = String(additionalData.baseAmount || 0);
    metadata.vatAmount = String(additionalData.vatAmount || 0);
    metadata.platformFee = String(additionalData.platformFee || 0);
  } else if (paymentType === 'timeline_extension') {
    metadata.orderId = additionalData.orderId;
    metadata.userId = additionalData.userId;
    metadata.extensionDays = additionalData.extensionDays;
    metadata.previousDeadline = additionalData.previousDeadline.toISOString();
    metadata.newDeadline = additionalData.newDeadline.toISOString();
    metadata.freelancerRevenue = additionalData.freelancerRevenue;
    metadata.vatRate = additionalData.vatRate;
  }

  return metadata;
};

// exports.withdrawFunds = async (req, res) => {
//     const { email, amount } = req.body; // Freelancer's email and withdrawal amount

//     try {
//         // Check if the freelancer account exists
//         let freelancerAccount = await Freelancer.findOne({ email });

//         // If the account doesn't exist, create it
//         if (!freelancerAccount) {
//             const account = await stripe.accounts.create({
//                 type: 'standard', // You can choose 'standard' or 'express'
//                 country: 'US', // Set the country for the connected account
//                 email: email, // Freelancer's email
//                 capabilities: {
//                     card_payments: { requested: true },
//                     transfers: { requested: true },
//                 },
//             });

//             // Create a new Freelancer record in the database
//             freelancerAccount = new Freelancer({
//                 email,
//                 stripeAccountId: account.id,
//                 availableBalance: 30, //
//             });

//             await freelancerAccount.save();
//         }

//         // Check if the available balance is sufficient
//         if (freelancerAccount.availableBalance < amount) {
//             return res.status(400).json({ error: 'Insufficient funds' });
//         }

//         // Create a payout to the freelancer's connected account
//         const payout = await stripe.payouts.create(
//             {
//                 amount: amount, 
//                 currency: 'usd', 
//             },
//             {
//                 stripeAccount: freelancerAccount.stripeAccountId, 
//             }
//         );

//         freelancerAccount.availableBalance -= amount;
//         await freelancerAccount.save();

//         res.status(200).json({ success: true, payout });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// };

exports.paypalWithdrawFunds = async (req, res) => {
    const { email, amount } = req.body; // Freelancer's email and withdrawal amount

    try {
        // Get PayPal access token
        const tokenResponse = await axios.post(
            'https://api-m.sandbox.paypal.com/v1/oauth2/token', // Use the live URL for production: 'https://api-m.paypal.com/v1/oauth2/token'
            'grant_type=client_credentials',
            {
                auth: {
                    username: process.env.PAYPAL_CLIENT_ID,
                    password: process.env.PAYPAL_SECRET,
                },
            }
        );

        const accessToken = tokenResponse.data.access_token;

        // Check if the freelancer exists in your database
        const freelancer = await Freelancer.findOne({ email });
        if (!freelancer) {
            return res.status(404).json({ error: 'Freelancer account not found' });
        }

        // Check if the freelancer has sufficient balance
        if (freelancer.availableBalance < amount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        // Create a PayPal payout
        const payoutResponse = await axios.post(
            'https://api-m.sandbox.paypal.com/v1/payments/payouts', // Use the live URL for production: 'https://api-m.paypal.com/v1/payments/payouts'
            {
                sender_batch_header: {
                    email_subject: 'You have a payout!',
                    email_message: 'You have received a payout via PayPal.',
                },
                items: [
                    {
                        recipient_type: 'EMAIL',
                        amount: {
                            value: amount.toFixed(2), // Amount in USD
                            currency: 'USD',
                        },
                        receiver: email, // PayPal email of the recipient
                        note: 'Payout from platform',
                    },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Deduct the amount from the freelancer's balance
        freelancer.availableBalance -= amount;
        await freelancer.save();

        res.status(200).json({
            success: true,
            message: 'Payout successfully processed via PayPal',
            payout: payoutResponse.data,
        });
    } catch (error) {
        console.error('PayPal Payout Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message,
        });
    }
};

exports.withdrawFunds = async (req, res) => {
    const { email, amount } = req.body; 

    try {
        let freelancerAccount = await Freelancer.findOne({ email });

        // If the account doesn't exist, create it
        if (!freelancerAccount) {
            const account = await stripe.accounts.create({
                type: 'express', // Type of account (can be 'express' or 'custom' based on your needs)
                country: 'US', // Set the country for the connected account
                email: email, // Freelancer's email
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });

            // Create a new Freelancer record in the database
            freelancerAccount = new Freelancer({
                email,
                stripeAccountId: account.id,
                availableBalance: 30, // You can update the balance as per your requirements
            });

            await freelancerAccount.save();

            // Create the onboarding link if the freelancer has not completed onboarding
            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: 'https://your-platform.com/onboarding-refresh', // Redirect if freelancer needs to update information
                return_url: 'https://your-platform.com/onboarding-success', // Redirect after successful onboarding
                type: 'account_onboarding', // Type of onboarding flow
            });

            // Send the onboarding link to the freelancer
            return res.status(200).json({ 
                success: true,
                message: 'Freelancer account created. Complete your onboarding.',
                link: accountLink.url // Redirect the freelancer to this URL to complete onboarding
            });
        }

        // If the freelancer already exists, check if they have completed onboarding
        const account = await stripe.accounts.retrieve(freelancerAccount.stripeAccountId);

        if (account.charges_enabled === false) {
            // If the freelancer has not completed onboarding, ask them to do so
            const accountLink = await stripe.accountLinks.create({
                account: freelancerAccount.stripeAccountId,
                refresh_url: 'https://noretmy.com/onboarding-refresh', // Redirect if freelancer needs to update information
                return_url: 'https://noretmy.com/onboarding-success', // Redirect after successful onboarding
                type: 'account_onboarding',
            })

            return res.status(400).json({
                success: false,
                message: 'Please complete the onboarding process before withdrawing funds.',
                link: accountLink.url // Send the onboarding link
            });
        }

        // Check if the available balance is sufficient
        if (freelancerAccount.availableBalance < amount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        // Create a payout to the freelancer's connected account
        const payout = await stripe.payouts.create(
            {
                amount: amount * 100, // Amount is in cents
                currency: 'usd',
            },
            {
                stripeAccount: freelancerAccount.stripeAccountId, // Freelancer's Stripe account ID
            }
        );

        // Update freelancer's balance after payout
        freelancerAccount.availableBalance -= amount;
        await freelancerAccount.save();

        res.status(200).json({ success: true, payout });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.processPayPalWithdrawal = async (email, amount) => {
    // Check if PayPal is configured
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
        console.error('[PayPal Payout] PayPal credentials not configured');
        return {
            success: false,
            message: 'PayPal payouts are not configured on the server.',
            error: 'Missing PAYPAL_CLIENT_ID or PAYPAL_SECRET'
        };
    }

    try {
        if (!email || amount <= 0) {
            throw new Error('Invalid email or amount.');
        }

        // Generate a unique sender batch ID
        const senderBatchId = `Payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Prepare the payout request using paypal-rest-sdk format
        const payoutRequest = {
            sender_batch_header: {
                sender_batch_id: senderBatchId,
                email_subject: "You have a payment from Noretmy!",
                email_message: "You have received your earnings. Thank you for working with Noretmy!"
            },
            items: [
                {
                    recipient_type: "EMAIL",
                    receiver: email,
                    amount: {
                        value: Number(amount).toFixed(2),
                        currency: "USD"
                    },
                    note: "Withdrawal from Noretmy platform",
                    sender_item_id: `Item_${Date.now()}`
                }
            ]
        };

        console.log('[PayPal Payout] Initiating payout to:', email, 'Amount:', amount);

        // Execute the payout using paypal-rest-sdk (promisified)
        const response = await new Promise((resolve, reject) => {
            paypalRestSdk.payout.create(payoutRequest, function (error, payout) {
                if (error) {
                    console.error('[PayPal Payout] Error:', error.response || error);
                    reject(error);
                } else {
                    console.log('[PayPal Payout] Success:', payout);
                    resolve(payout);
                }
            });
        });

        // Return success response
        return {
            success: true,
            message: 'Withdrawal successful.',
            payoutBatchId: response.batch_header.payout_batch_id,
        };
    } catch (error) {
        console.error('[PayPal Payout] Error:', error.message || error);
        
        // Extract meaningful error message from PayPal response
        let errorMessage = 'Withdrawal failed. Please try again later.';
        if (error.response && error.response.message) {
            errorMessage = error.response.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        return {
            success: false,
            message: errorMessage,
            error: error.message || 'Unknown error occurred',
        };
    }
};

exports.processRefund = async (req, res) => {
    const { chargeId, amount } = req.body; // Charge ID and refund amount

    try {
        // Create a refund
        const refund = await stripe.refunds.create({
            charge: chargeId,
            amount: amount, // Amount in cents (optional, refund full amount if omitted)
        });

        res.status(200).json({ success: true, refund });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature']; 
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; 
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'payment_intent.amount_capturable_updated':
        await handlePaymentIntentAuthorized(event.data.object);
        break;
      default:
        }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook] Error: ', err.message);
    console.error('[Stripe Webhook] Stack:', err.stack);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

// Function to handle authorized payment (Milestones)
const handlePaymentIntentAuthorized = async (paymentIntent) => {
  const { id, metadata } = paymentIntent;
  
  try {
    if (metadata.milestoneEnabled === 'true' && metadata.orderId) {
      const { processAcceptedMilestone } = require('../services/paymentMilestoneService');
      const order = await Order.findById(metadata.orderId);
      
      if (order && order.isMilestone && order.paymentMilestoneStage === 'order_placed') {
         // Initialize FIRST milestone (Accepted - 10%)
         // Note: The payment intent is now Authorized for Full Amount.
         // Calling processAcceptedMilestone will set status to 'accepted'.
         // It creates the milestone record.
         await processAcceptedMilestone(order._id, order.sellerId);
         
         // Also update order status to started/accepted if not already
         order.isPaid = false; // Not paid yet, just authorized
         order.paymentStatus = 'authorized'; 
         if (order.status === 'created') {
             order.status = 'accepted'; 
         }
         await order.save();
      }
    }
  } catch (err) {
    console.error('Error handling authorized payment intent:', err);
  }
};

// Function to handle successful payment intent
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  const { id, amount_received, payment_method, metadata } = paymentIntent;
  const { 
    paymentType, 
    orderId, 
    userId, 
    gigId, 
    promotionPlan,
    vatRate,
    baseAmount,
    vatAmount,
    platformFee
  } = metadata;

  try {
    if (paymentType === 'order_payment') {
      // Handle Order Payment
      const { getSellerPayout } = require('../services/priceUtil');
      const statusHistoryEntry = { status: "started", createdAt: Date.now() };
      const updatedOrder = await Order.findOneAndUpdate(
        { payment_intent: id },
        {
          isCompleted: true,
          status: 'started',
          isPaid: true,
          paymentStatus: 'completed',
          paymentMethod: payment_method,
          amountReceived: amount_received / 100,
          $push: { 
            statusHistory: statusHistoryEntry,
            timeline: {
              event: 'Payment Confirmed',
              description: 'Payment secured in escrow. Order started.',
              timestamp: new Date(),
              actor: 'system'
            }
          },
        },
        { new: true }
      );

      if (!updatedOrder) {
        console.error('Order not found for PaymentIntent ID:', id);
        return;
      }

      // Fetch seller and buyer emails
      const [seller, buyer] = await Promise.all([
        User.findById(updatedOrder.sellerId),
        User.findById(updatedOrder.buyerId),
      ]);

      // Add to escrow (pending balance)
      if (seller) {
        const netEarnings = getSellerPayout(updatedOrder.price);
        seller.revenue.total += netEarnings;
        seller.revenue.pending += netEarnings;
        await seller.save();
        }

      if (!seller || !buyer) {
        throw new Error('Seller or buyer not found.');
      }

      const sellerEmail = seller.email;
      const buyerEmail = buyer.email;

      // Prepare messages

      const gig=  await Job.findById(updatedOrder.gigId)

      const buyerData= {_id:updatedOrder._id,price:updatedOrder.price,createdAt:updatedOrder.createdAt,
        vatRate:metadata.vatRate, customerName : buyer.username, gigTitle : gig.title, discount  : metadata.discount
      }

      const sellerData = {_id:updatedOrder._id,price:updatedOrder.price,createdAt:updatedOrder.createdAt ,gigTitle : gig.title, sellerName:seller.username}

      // Send notifications
      await Promise.all([
        sendOrderSuccessEmail(buyerEmail,buyerData),
        sendSellerOrderNotificationEmail(sellerEmail,sellerData)  ]);

      } else if (paymentType === 'gig_promotion' || paymentType === 'monthly_promotion') {
      // ========== UNIFIED PROMOTION HANDLER ==========
      // Uses PromotionPurchase as single source of truth
      // Idempotent: checks for existing record before creating
      
      // 1. Idempotency check - prevent duplicate processing
      const existingPurchase = await PromotionPurchase.findOne({ stripePaymentIntentId: id });
      if (existingPurchase) {
        return;
      }
      
      // 2. Get plan details from constants
      const plan = getPlan(promotionPlan);
      if (!plan) {
        console.error('[Promotion] Invalid plan key:', promotionPlan);
        return;
      }
      
      // 3. Validate user exists
      const user = await User.findById(userId);
      if (!user) {
        console.error('[Promotion] User not found:', userId);
        return;
      }
      
      // 4. For single gig promotions, validate gig exists
      let gig = null;
      if (paymentType === 'gig_promotion' && gigId) {
        gig = await Job.findById(gigId);
        if (!gig) {
          console.error('[Promotion] Gig not found:', gigId);
          return;
        }
      }
      
      // 5. Calculate dates
      const now = new Date();
      const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
      
      // 6. Create PromotionPurchase record (single source of truth)
      const promotionPurchase = new PromotionPurchase({
        stripePaymentIntentId: id,
        userId: new mongoose.Types.ObjectId(userId),
        planKey: plan.key,
        planName: plan.name,
        planPriority: plan.priority,
        promotionType: paymentType === 'gig_promotion' ? 'single_gig' : 'all_gigs',
        gigId: gigId ? new mongoose.Types.ObjectId(gigId) : null,
        status: 'active',
        purchasedAt: now,
        activatedAt: now,
        expiresAt: expiresAt,
        baseAmount: parseFloat(baseAmount || plan.price),
        vatRate: parseFloat(vatRate || 0),
        vatAmount: parseFloat(vatAmount || 0),
        platformFee: parseFloat(platformFee || 0),
        totalAmount: amount_received / 100,
        durationDays: plan.durationDays
      });
      
      try {
        await promotionPurchase.save();
        } catch (saveError) {
        if (saveError.code === 11000) {
          // Duplicate key - already processed
          return;
        }
        console.error('[Promotion] Failed to save PromotionPurchase:', saveError);
        return;
      }
      
      // 7. Send email notification
      try {
        const emailData = {
          promotionPlanId: promotionPurchase._id,
          customerName: user.username,
          gigTitle: gig ? gig.title : 'All Your Gigs',
          createdAt: promotionPurchase.createdAt,
          price: plan.price,
          planName: plan.name,
          expiresAt: expiresAt,
          vatRate: vatRate || 0
        };
        
        if (paymentType === 'gig_promotion') {
          await sendPromotionPlanEmail(user.email, emailData);
        } else {
          await sendAllGigsPromotionEmail(user.email, emailData);
        }
        } catch (emailError) {
        console.error('[Promotion] Email failed:', emailError.message);
        // Don't fail the whole process for email errors
      }
      
      // 8. Notify admins
      try {
        const admins = await User.find({ role: 'admin' });
        const notificationPromises = admins.map(admin => {
          return notificationService.createNotification({
            userId: admin._id,
            title: '💰 New Promotion Purchase',
            message: `${user.username} purchased "${plan.name}" for $${(amount_received / 100).toFixed(2)}`,
            type: 'payment',
            link: '/admin/promotions'
          });
        });
        await Promise.all(notificationPromises);
      } catch (adminNotifError) {
        console.error('[Promotion] Admin notification failed:', adminNotifError.message);
      }
      
      } else if (paymentType === 'timeline_extension') {
      // Handle Timeline Extension Payment
      const { processTimelineExtension } = require('./timelineExtensionController');
      
      const success = await processTimelineExtension(paymentIntent);
      
      if (success) {
        } else {
        console.error('Failed to process timeline extension');
      }
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error.message);
  }
};

async function handlePaymentIntentFailed(paymentIntent) {
  const { id, last_payment_error } = paymentIntent;

  try {
    // Log the failed payment and update the order accordingly
    // Optionally, update the order's status to indicate a failed payment
    const updatedOrder = await Order.findOneAndUpdate(
      { payment_intent: id },
      { 
        isCompleted: false, 
        error: last_payment_error.message 
      },
      { new: true }
    );

    if (updatedOrder) {
      }
  } catch (err) {
    console.error('Error handling failed payment intent:', err);
  }
}

