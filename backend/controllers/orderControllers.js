const Job = require("../models/Job");
const Order = require("../models/Order");
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Conversation = require("../models/Conversation");
const Project = require("../models/Project");
const TimelineExtension = require('../models/TimelineExtension');
const { createCustomerAndPaymentIntentUtil } = require("./PaymentController");

const dayjs = require("dayjs");
const axios = require('axios');
const { getVatRate } = require("./vatController");
const Review = require("../models/Review");
const { getAmountWithFeeAndTax, getSellerPayout } = require("../services/priceUtil");

const { getVATForUser, calculateVATBreakdown, PLATFORM_FEE_RATE } = require("../services/vatService");

const PAYPAL_API = process.env.PAYPAL_API || "https://api-m.sandbox.paypal.com";
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

const mongoose = require('mongoose');
const { uploadFiles } = require("../utils/uploadFiles");
const { sendOrderRequestEmail, sendOnboardingEmail, sendOrderDeliveredEmail, sendOrderCompletedEmail, sendOrderAcceptedEmail, sendOrderRejectedEmail } = require("../services/emailService");
const { calculateDeliveryDate } = require("../utils/dateCalculate");

const badgeService = require("../services/badgeService");

const notificationService = require("../services/notificationService");
const paymentMilestoneService = require('../services/paymentMilestoneService');











const createOrder = async (req, res) => {
  try {
    const { userId } = req;
    const { gigId, price, isMilestone, isCustomOrder, milestones, custom_BuyerId } = req.body;

    if (!isMilestone && !isCustomOrder) {
      if (!gigId || !price || !userId) {
        return res.status(400).json({ message: "All required fields must be provided." });
      }
    }

    let user = null;

    let updatedMilestones = null;
    if (isMilestone) {
      if (!Array.isArray(milestones) || milestones.length === 0) {
        return res.status(400).json({ message: "Milestones are required for milestone orders." });
      }
      const isValidMilestones = milestones.every(
        (milestone) =>
          milestone.title &&
          milestone.description &&
          milestone.deliveryTime &&
          milestone.amount
      );
      if (!isValidMilestones) {
        return res.status(400).json({ message: "Each milestone must have a title, description, deliveryTime, and amount." });
      }

      updatedMilestones = milestones.map((milestone) => ({
        ...milestone,
        deliveryDate: calculateDeliveryDate(milestone.deliveryTime),
      }));

      user = await User.findById(custom_BuyerId);
    }
    else if (isCustomOrder) {
      user = await User.findById(custom_BuyerId);

    }

    const gig = await Job.findById(gigId);

    if (!gig) {
      return res.status(404).json({ message: "Gig not found." });
    }

    let orderPrice = price;

    if (!isMilestone && !isCustomOrder) {
      if (gig.discount && gig.discount > 0) {
        orderPrice -= orderPrice * (gig.discount / 100);
      }
    }

    const vatBreakdown = await getVATForUser(userId, orderPrice);
    
    let selectedPlan = null;
    if (price == gig.pricingPlan.basic.price) {
      selectedPlan = gig.pricingPlan.basic;
    } else if (price == gig.pricingPlan.premium.price) {
      selectedPlan = gig.pricingPlan.premium;
    } else if (price == gig.pricingPlan.pro.price) {
      selectedPlan = gig.pricingPlan.pro;
    }

    let deliveryDate = null;
    if (!isMilestone && selectedPlan) {
      deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + selectedPlan.deliveryTime);
    }
    
    const { 
      platformFee, 
      vatAmount, 
      totalAmount, 
      vatRate, 
      clientCountry,
      sellerEarnings 
    } = vatBreakdown.breakdown || {};

    const newOrder = new Order({
      gigId: gigId,
      price: orderPrice,
      baseAmount: orderPrice, // Explicitly set base amount
      feeAndTax: platformFee + (vatAmount || 0), // Legacy field compatibility
      platformFee: platformFee,
      vatAmount: vatAmount || 0,
      vatRate: vatRate || 0,
      totalAmount: totalAmount || (orderPrice + platformFee),
      clientCountry: clientCountry,
      platformFeeRate: PLATFORM_FEE_RATE,
      sellerId: gig.sellerId,
      buyerId: buyerId,
      payment_intent: "Temp",
      isMilestone: isMilestone || false,
      type: isMilestone ? "milestone" : isCustomOrder ? "custom" : "simple",
      milestones: isMilestone ? updatedMilestones : [],
      ...(deliveryDate ? { deliveryDate } : {}),
    });

    const savedOrder = await newOrder.save();
    let client_secret = null;

    const buyerId = (isMilestone || isCustomOrder) ? custom_BuyerId : userId;
    const buyerEmail = (isMilestone || isCustomOrder) ? user.email : user.email;

    if (!isMilestone && !isCustomOrder) {

      const rate = vatRate; // Use the one from breakdown
      const additionalData = { orderId: savedOrder._id.toString(), userId, vatRate: rate, discount: gig.discount };

      savedOrder.payment_intent = "Temp";
      savedOrder.paymentStatus = 'pending';
      await savedOrder.save();

      const paymentIntentResponse = await createCustomerAndPaymentIntentUtil(newOrder.totalAmount, buyerEmail, "order_payment", additionalData);
      const { client_secret: secret, payment_intent } = paymentIntentResponse;

      savedOrder.payment_intent = payment_intent;
      savedOrder.paymentIntentId = payment_intent; // Store for verification
      await savedOrder.save();

      client_secret = secret;
    }

    if (isCustomOrder || isMilestone) {
      const requestDetails = {
        _id: savedOrder._id,
        details: "ddsadsa",
        price: savedOrder.price,
        senderName: "dsadsada",
        createdAt: savedOrder.createdAt,
        decription: "fdsffdsfds"
      }
      await sendOrderRequestEmail(buyerEmail, requestDetails);
    }

    try {
      const buyer = await User.findById(buyerId);
      const seller = await User.findById(gig.sellerId);
      const gigDetails = await Job.findById(order.gigId);

      if (buyer && buyer.email) {
        const orderDetailsForBuyer = {
          _id: savedOrder._id,
          price: savedOrder.price,
          createdAt: savedOrder.createdAt,
          vatRate: vatRate || 0,
          customerName: buyer.fullName || buyer.username,
          gigTitle: gigDetails?.title || 'Service',
          discount: gig.discount || 0,
          deliveryDate: savedOrder.deliveryDate,
          totalAmount: savedOrder.totalAmount
        };
        await sendOrderSuccessEmail(buyer.email, orderDetailsForBuyer);
        console.log('✅ Order confirmation email sent to buyer:', buyer.email);
      }

      if (seller && seller.email) {
        const orderDetailsForSeller = {
          orderId: savedOrder._id,
          buyerName: buyer?.fullName || buyer?.username || 'Customer',
          gigTitle: gigDetails?.title || 'Service',
          price: savedOrder.price,
          deliveryDate: savedOrder.deliveryDate,
          orderType: savedOrder.type,
          requirements: savedOrder.requirements || 'No specific requirements provided'
        };
        await sendSellerOrderNotificationEmail(seller.email, orderDetailsForSeller);
        console.log('✅ New order notification sent to seller:', seller.email);
      }
    } catch (emailError) {
      console.error('Error sending order creation emails:', emailError.message);
    }

    try {
      const conversationId = gig.sellerId + buyerId;
      const existingConversation = await Conversation.findOne({ id: conversationId });
      
      if (!existingConversation) {
        const newConversation = new Conversation({
          id: conversationId,
          sellerId: gig.sellerId,
          buyerId: buyerId,
          readBySeller: false,
          readByBuyer: true,
          lastMessage: `New order started for: ${gig.title}`,
        });
        await newConversation.save();
        }
    } catch (convError) {
      }

    const response = {
      message: "Order created successfully",
      order: savedOrder,
    };

    if (client_secret) {
      response.client_secret = client_secret;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const addOrderRequirement = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId, requirements } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.buyerId !== userId) {
      return res.status(403).json({ message: 'Unauthorized to update this order' });
    }

    if (order.status !== "created") {
      return res.status(400).json({ message: "Order is not in a valid state to be started" });
    }

    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      if (uploadResult.success) {
        uploadedFiles = uploadResult.urls; // Store uploaded file URLs
      } else {
        return res.status(500).json({ message: 'File upload failed', error: uploadResult.error });
      }
    }

    order.orderRequirements = requirements;  // Save text requirements
    order.attachments = uploadedFiles.map(file => file.url);
    order.status = "requirementsSubmitted";

    const statusUpdate = {
      status: "requirementsSubmitted",
      changedAt: new Date(),
    };
    order.statusHistory.push(statusUpdate);

    await order.save();

    try {
      const gig = await Job.findById(order.gigId);
      await notificationService.notifyRequirementsSubmitted(
        order.sellerId,
        order._id.toString(),
        gig?.title || 'Order'
      );
    } catch (notifError) {
      }

    return res.status(200).json({
      message: 'Requirements and attachments added successfully',
      order,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

const startOrder = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "OrderId is missing" });

    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.sellerId.toString() !== userId) {
      return res.status(403).json({ error: "You are not authorized to start this order" });
    }

    if (order.status !== "requirementsSubmitted" && order.status !== "accepted") {
      return res.status(400).json({ error: "Order is not in a valid state to be started" });
    }

    const seller = await User.findById(userId);
    
    order.status = "started";
    order.progress = 40; // Started progress
    order.paymentMilestoneStage = 'in_escrow'; // Update milestone stage
    
    const statusUpdate = {
      status: "started",
      changedAt: new Date(),
    };
    order.statusHistory.push(statusUpdate);
    
    order.timeline.push({
      event: 'Work Started',
      description: `${seller?.fullName || seller?.username} started working on the project`,
      timestamp: new Date(),
      actor: 'seller'
    });

    if (order.paymentBreakdown && order.paymentBreakdown.escrowAmount > 0) {
      try {
        const PaymentMilestone = require('../models/PaymentMilestone');
        const escrowMilestone = new PaymentMilestone({
          orderId: order._id,
          stage: 'in_escrow',
          percentageOfTotal: 50,
          amount: order.paymentBreakdown.escrowAmount,
          currency: order.currency || 'USD',
          stripePaymentIntentId: order.payment_intent,
          paymentStatus: 'held_in_escrow',
          capturedAt: new Date(),
          triggeredBy: {
            role: 'seller',
            action: 'order_started'
          }
        });
        await escrowMilestone.save();
        
        order.paymentBreakdown.pendingReleaseAmount += order.paymentBreakdown.escrowAmount;
        order.escrowStatus = 'full';
        order.escrowLockedAt = new Date();
        
        order.timeline.push({
          event: 'Escrow Captured',
          description: `50% ($${order.paymentBreakdown.escrowAmount.toFixed(2)}) captured and held in escrow`,
          timestamp: new Date(),
          actor: 'system'
        });
        
        console.log('[Order Start] 50% escrow captured:', order.paymentBreakdown.escrowAmount);
      } catch (escrowError) {
        console.error('[Order Start] Error capturing escrow:', escrowError);
      }
    }

    await order.save();

    try {
      const gig = await Job.findById(order.gigId);
      await notificationService.notifyOrderStarted(
        order.buyerId,
        order._id.toString(),
        gig?.title || 'Order'
      );

      const buyer = await User.findById(order.buyerId);
      if (buyer && buyer.email) {
        await sendUserNotificationEmail(
          buyer.email,
          'order_started',
          `Work has started on your order #${order._id}`,
          'buyer',
          {
            orderId: order._id,
            gigTitle: gig?.title || 'Service',
            sellerName: seller?.fullName || seller?.username || 'Freelancer',
            deliveryDate: order.deliveryDate,
            startedAt: order.statusHistory[order.statusHistory.length - 1].changedAt
          }
        );
        console.log('\u2705 Order started email sent to buyer:', buyer.email);
      }
    } catch (notifError) {
      console.error('Error sending order started notification:', notifError);
    }

    res.status(200).json({ message: "Order started successfully", order });
  } catch (error) {
    console.error("Error starting the order:", error.message);
    res.status(500).json({ error: "An error occurred while starting the order" });
  }
};

const deliverOrder = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId, deliveryDescription } = req.body;

    if (!orderId || !deliveryDescription) {
      return res.status(400).json({ message: "orderId or delivery description is missing!" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.sellerId.toString() !== userId) {
      return res.status(403).json({ error: "You are not authorized to complete this order" });
    }

    if (order.status !== "started" && order.status !== "requestedRevision") {
      return res.status(400).json({ error: "Order is not in a valid state to be delivered" });
    }

    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      if (uploadResult.success) {
        uploadedFiles = uploadResult.urls.map(file => file.url);
      } else {
        return res.status(500).json({ message: 'File upload failed', error: uploadResult.error });
      }
    }

    const seller = await User.findById(userId);

    order.status = "delivered";
    order.deliveryDescription = deliveryDescription;
    order.deliveryAttachments = uploadedFiles;
    order.progress = 70; // Delivery is at 70%
    order.paymentMilestoneStage = 'delivered'; // Update milestone stage

    const statusUpdate = {
      status: "delivered",
      changedAt: new Date(),
      deliveryDescription: deliveryDescription,
      deliveryAttachments: uploadedFiles,
    };

    order.statusHistory.push(statusUpdate);
    
    order.timeline.push({
      event: 'Work Delivered',
      description: `${seller?.fullName || seller?.username} delivered the completed work`,
      timestamp: new Date(),
      actor: 'seller'
    });
    
    if (order.paymentBreakdown && order.paymentBreakdown.deliveryAmount > 0) {
      try {
        const PaymentMilestone = require('../models/PaymentMilestone');
        const deliveryMilestone = new PaymentMilestone({
          orderId: order._id,
          stage: 'delivered',
          percentageOfTotal: 20,
          amount: order.paymentBreakdown.deliveryAmount,
          currency: order.currency || 'USD',
          stripePaymentIntentId: order.payment_intent,
          paymentStatus: 'pending_release',
          capturedAt: new Date(),
          triggeredBy: {
            role: 'seller',
            action: 'order_delivered'
          }
        });
        await deliveryMilestone.save();
        
        order.paymentBreakdown.pendingReleaseAmount += order.paymentBreakdown.deliveryAmount;
        
        order.timeline.push({
          event: 'Delivery Payment Captured',
          description: `20% ($${order.paymentBreakdown.deliveryAmount.toFixed(2)}) captured on delivery`,
          timestamp: new Date(),
          actor: 'system'
        });
        
        console.log('[Order Delivery] 20% delivery payment captured:', order.paymentBreakdown.deliveryAmount);
      } catch (deliveryError) {
        console.error('[Order Delivery] Error capturing delivery payment:', deliveryError);
      }
    }
    
    await order.save();
    
    try {
      const paymentMilestoneService = require('../services/paymentMilestoneService');
      await paymentMilestoneService.processDeliveryMilestone(orderId, userId);
    } catch (milestoneError) {
      }

    try {
      const gig = await Job.findById(order.gigId);
      await notificationService.notifyOrderDelivered(
        order.buyerId,
        order._id.toString(),
        gig?.title || 'Order'
      );
      
      const buyer = await User.findById(order.buyerId);
      if (buyer && buyer.email) {
        await sendOrderDeliveredEmail(buyer.email, {
          customerName: buyer.username || buyer.email,
          orderId: order._id.toString(),
          gigTitle: gig?.title || 'Your Order',
          sellerName: seller?.username || 'The freelancer',
          deliveryDescription
        }).catch(err => console.error("Error sending order delivered email:", err));
    } 
  }
    catch (notifError) {
      console.error("Error sending order delivered notification:", notifError);
      }

    res.status(200).json({ message: "Order delivered successfully", order });
  } catch (error) {
    console.error("Error delivering the order the order:", error.message);
    res.status(500).json({ error: "An error occurred while delivering the order" });
  }
};

const requestRevision = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId, reason } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.buyerId.toString() !== userId) {
      return res.status(403).json({ error: "You are not authorized to complete this order" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({ error: "Order is not in a valid state to be Request revison" });
    }

    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      if (uploadResult.success) {
        uploadedFiles = uploadResult.urls.map(file => file.url);
      } else {
        return res.status(500).json({ message: 'File upload failed', error: uploadResult.error });
      }
    }

    order.status = "requestedRevision";
    order.revisionReason = reason;

    const statusUpdate = {
      status: "requestedRevision",
      changedAt: new Date(),
      reason: reason,
      deliveryAttachments: uploadedFiles,
    };
    order.statusHistory.push(statusUpdate);
    await order.save();

    try {
      const gig = await Job.findById(order.gigId);
      await notificationService.notifyRevisionRequested(
        order.sellerId,
        order._id.toString(),
        gig?.title || 'Order',
        reason
      );

      const seller = await User.findById(order.sellerId);
      const buyer = await User.findById(userId);
      if (seller && seller.email) {
        const revisionDetails = {
          orderId: order._id,
          gigTitle: gig?.title || 'Service',
          buyerName: buyer?.fullName || buyer?.username || 'Customer',
          revisionReason: reason,
          orderStatus: order.status
        };
        await sendUserNotificationEmail(
          seller.email,
          'revision_requested',
          `Revision requested for Order #${order._id}. Reason: ${reason}`,
          'seller',
          revisionDetails
        );
        console.log('✅ Revision request email sent to seller:', seller.email);
      }
    } catch (notifError) {
      console.error('Error sending revision notification:', notifError);
    }

    res.status(200).json({ message: "Revision requested successfully", order });
  } catch (error) {
    console.error("Error requesting revision:", error.message);
    res.status(500).json({ error: "An error occrured while creating revison request!" });
  }
};

const acceptOrder = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.buyerId.toString() !== userId) {
      return res.status(403).json({ error: "You are not authorized to complete this order" });
    }

    if (order.status !== "delivered" && order.status !== "requestedRevision") {
      return res.status(400).json({ error: "Order is not in a valid state to be accepted " });
    }
    const completionDate = new Date();

    order.status = "completed";
    order.orderCompletionDate = completionDate;
    order.isCompleted = true;
    order.progress = 100; // Set to 100% when completed
    order.paymentMilestoneStage = 'reviewed'; // Update milestone stage
    
    const createdDate = new Date(order.createdAt);
    const diffTime = completionDate - createdDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    order.completionTime = diffDays;
    
    if (order.deliveryDate) {
      order.deadlineMet = completionDate <= new Date(order.deliveryDate);
    }
    
    const statusUpdate = {
      status: "waitingReview",
      changedAt: new Date(),
    };
    order.statusHistory.push(statusUpdate);
    
    const buyer = await User.findById(userId);
    order.timeline.push({
      event: 'Work Approved',
      description: `${buyer?.fullName || buyer?.username} approved the delivered work. ${order.deadlineMet ? '✅ Completed on time!' : '⚠️ Completed after deadline'}`,
      timestamp: new Date(),
      actor: 'buyer'
    });

    if (order.paymentBreakdown && order.paymentBreakdown.reviewAmount > 0) {
      try {
        const PaymentMilestone = require('../models/PaymentMilestone');
        const reviewMilestone = new PaymentMilestone({
          orderId: order._id,
          stage: 'reviewed',
          percentageOfTotal: 20,
          amount: order.paymentBreakdown.reviewAmount,
          currency: order.currency || 'USD',
          stripePaymentIntentId: order.payment_intent,
          paymentStatus: 'captured',
          capturedAt: new Date(),
          triggeredBy: {
            role: 'buyer',
            action: 'order_accepted'
          }
        });
        await reviewMilestone.save();
        
        order.paymentBreakdown.pendingReleaseAmount += order.paymentBreakdown.reviewAmount;
        
        order.timeline.push({
          event: 'Review Payment Captured',
          description: `20% ($${order.paymentBreakdown.reviewAmount.toFixed(2)}) final payment captured on review`,
          timestamp: new Date(),
          actor: 'system'
        });
        
        console.log('[Order Accept] 20% review payment captured:', order.paymentBreakdown.reviewAmount);
      } catch (reviewError) {
        console.error('[Order Accept] Error capturing review payment:', reviewError);
      }
    }

    const gigId = order.gigId;

    const updatedGig = await Job.findByIdAndUpdate(
      gigId,
      {
        $inc: { sales: 1 } // Increment sales by 1
      },
      { new: true } // Return the updated document
    );

    try {
      const { getSellerPayout } = require('../services/priceUtil');
      const paymentMilestoneService = require('../services/paymentMilestoneService');
      const Freelancer = require('../models/Freelancer');
      
      const totalCapturedAmount = order.paymentBreakdown.pendingReleaseAmount || 0;
      const amountToRelease = getSellerPayout(totalCapturedAmount);
      const seller = await User.findById(order.sellerId);
      
      if (seller) {
        seller.revenue = seller.revenue || { total: 0, available: 0, pending: 0, withdrawn: 0 };
        seller.revenue.available = (seller.revenue.available || 0) + amountToRelease;
        seller.revenue.pending = Math.max(0, (seller.revenue.pending || 0) - totalCapturedAmount);
        seller.markModified('revenue');
        await seller.save();
        console.log('💵 Funds released to seller - Available:', seller.revenue.available, 'Pending:', seller.revenue.pending);
        }
      
      const freelancer = await Freelancer.findOne({ userId: order.sellerId });
      if (freelancer) {
        await freelancer.releaseEarnings(amountToRelease);
      }
      
      order.paymentMilestoneStage = 'completed';
      order.escrowStatus = 'released';
      order.paymentBreakdown = {
        ...order.paymentBreakdown,
        totalReleasedAmount: totalCapturedAmount,
        pendingReleaseAmount: 0,
        escrowAmount: 0,
        deliveryAmount: 0,
        reviewAmount: 0
      };
      order.fundsReleasedAt = new Date();
      
      await paymentMilestoneService.processReviewMilestone(order._id, userId);
      
    } catch (revError) {
      console.error('[Escrow Error] Failed to release funds in acceptOrder:', revError);
    }  
    try {
      const sellerProfile = await UserProfile.findOne({ userId: order.sellerId });
      if (sellerProfile) {
        sellerProfile.totalCompletedOrders = (sellerProfile.totalCompletedOrders || 0) + 1;
        await sellerProfile.save();
      }
      
      await badgeService.updateSellerMetricsOnOrderComplete(order.sellerId, order);
    } catch (profileError) {
      }

    await order.save();

    try {
      const gig = await Job.findById(order.gigId);
      const seller = await User.findById(order.sellerId);
      
      // Calculate platform commission (5% of total amount)
      const totalCapturedAmount = order.paymentBreakdown.totalReleasedAmount || 0;
      const platformCommission = totalCapturedAmount * PLATFORM_FEE_RATE;
      
      await notificationService.notifyOrderCompleted(
        order.buyerId,
        order.sellerId,
        order._id.toString(),
        gig?.title || 'Order',
        platformCommission
      );
      
      if (seller && seller.email) {
        const { getSellerPayout } = require('../services/priceUtil');
        const totalCapturedAmount = order.paymentBreakdown.totalReleasedAmount || 0;
        const amountEarned = getSellerPayout(totalCapturedAmount);
        
        await sendOrderCompletedEmail(seller.email, {
          orderId: order._id.toString(),
          sellerName: seller.username || seller.email,
          buyerName: buyer?.username || 'The client',
          gigTitle: gig?.title || 'Order',
          amount: amountEarned,
          totalAmount: totalCapturedAmount,
          isForSeller: true,
          completedAt: order.orderCompletionDate,
          deadlineMet: order.deadlineMet
        });
        console.log('✅ Order completed email sent to seller:', seller.email);
        
        await sendUserNotificationEmail(
          seller.email,
          'payment_received',
          `Payment of $${amountEarned.toFixed(2)} has been released to your available balance for Order #${order._id}`,
          'seller',
          {
            orderId: order._id,
            gigTitle: gig?.title || 'Service',
            buyerName: buyer?.fullName || buyer?.username || 'Customer',
            totalAmount: totalCapturedAmount.toFixed(2),
            sellerPayout: amountEarned.toFixed(2)
          }
        );
        console.log('✅ Payment received email sent to seller:', seller.email);
      }
    } catch (notifError) {
      console.error("Error sending order completed notification:", notifError);
      }

    res.status(200).json({ 
      message: "Order accepted successfully! You can now proceed to payment and leave a review.", 
      order 
    });
  } catch (error) {
    console.error("Error requesting revision:", error.message);
    res.status(500).json({ error: "An error occrured while creating revison request!" });
  }
};

const confirmMilestoneOrCustomOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const { userId } = req;

    if (!userId) {
      return res.status(401).json({ message: "You are not authenticated!" });

    }

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required." });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.buyerId.toString() !== userId) {
      return res.status(403).json({ error: "You are not authorized to complete this order" });
    }

    const price = order.price;

    if (!price) {
      return res.status(400).json({ message: "Invalid order: price not found." });
    }

    const user = await User.findById(userId);

    if (!user || !user.email) {
      return res.status(404).json({ message: "User or user email not found." });
    }

    const email = user.email;

    const rate = await getVatRate(userId);
    const totalAmountWithFeesAndTax = getAmountWithFeeAndTax(price, rate);

    const orderDetails = { userId, orderId, vatRate: rate }

    if (order.payment_intent && order.payment_intent !== "Temp") {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.paymentIntents.cancel(order.payment_intent);
        console.log('Cancelled old payment intent:', order.payment_intent);
      } catch (cancelError) {
        console.log('Could not cancel old payment intent (may not exist):', cancelError.message);
      }
    }
    order.payment_intent = "Temp";
    order.paymentStatus = 'pending';
    await order.save();

    const paymentIntentResponse = await createCustomerAndPaymentIntentUtil(totalAmountWithFeesAndTax, email, "order_payment", orderDetails);

    if (!paymentIntentResponse) {
      return res.status(500).json({ message: "Failed to create payment intent." });
    }

    const { client_secret, payment_intent } = paymentIntentResponse;

    order.payment_intent = payment_intent;
    await order.save();

    res.status(200).json({
      message: "Payment intent created successfully.",
      client_secret: client_secret,
    });
  } catch (error) {
    console.error("Error confirming milestone or custom order:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const getCustomerOrderRequests = async (req, res) => {
  try {
    const { userId } = req;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    const orders = await Order.find({
      buyerId: userId,
      createdAt: { $gte: thirtyDaysAgo },
      isCompleted: false,
      $or: [{ type: "milestone" }, { type: "custom" }],
    });

    if (!orders || orders.length === 0) {
      return res.status(200).json([]);
    }

    const response = await Promise.all(orders.map(async (order) => {
      const gig = await Job.findById(order.gigId);
      if (!gig) {
        return { error: "Gig not found" };
      }

      const user = await User.findById(gig.sellerId);
      if (!user) {
        return { error: "Seller not found" };
      }

      const userProfile = await UserProfile.findOne({ userId: user._id });
      const sellerImage = userProfile && userProfile.profilePicture ? userProfile.profilePicture : 'https://via.placeholder.com/100';

      const baseOrder = {
        id: order._id,
        sellerName: user.username,
        sellerImage: sellerImage,
        title: gig.title,
        deliveryDate: order.createdAt,
        price: order.price,
        type: order.type,
      };

      if (order.type === "custom") {
        return baseOrder;
      }

      if (order.type === "milestone" && Array.isArray(order.milestones)) {
        const milestones = order.milestones.map(milestone => ({
          title: milestone.title,
          description: milestone.description,
          deliveryDate: milestone.deliveryTime,
          price: milestone.amount,
        }));
        return { ...baseOrder, milestones };
      }

      return baseOrder;
    }));

    const validOrders = response.filter(order => !order.error);

    res.status(200).json(validOrders);

  } catch (error) {
    console.error("Error fetching customer order requests:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const updateMilestoneStatus = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId, milestoneId, newStatus, deliveryDescription, reason } = req.body;

    if (!userId) {
      res.status(401).json({ message: "User is not authenticated!" })
    }
    if (!orderId || !milestoneId || !newStatus) {
      return res.status(400).json({ message: 'Order ID, Milestone ID, and new status are required.' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const milestone = order.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found.' });
    }

    const validTransitions = {
      pending: ['started'],
      started: ['delivered', 'requestedRevision'],
      requestedRevision: ["delivered"],
      delivered: ['approved', 'requestedRevision'],
    };

    if (!validTransitions[milestone.status]?.includes(newStatus)) {
      return res.status(400).json({
        message: `Invalid status transition from '${milestone.status}' to '${newStatus}'.`,
      });
    }

    const milestoneIndex = order.milestones.findIndex((m) => m._id.toString() === milestoneId);
    if (newStatus === 'started' && milestoneIndex > 0) {
      const previousMilestone = order.milestones[milestoneIndex - 1];
      if (previousMilestone.status !== 'approved') {
        return res.status(400).json({
          message: 'You cannot start this milestone until the previous milestone is approved.',
        });
      }
    }

    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      if (uploadResult.success) {
        uploadedFiles = uploadResult.urls.map(file => file.url);
      } else {
        return res.status(500).json({ message: 'File upload failed', error: uploadResult.error });
      }
    }

    const statusUpdate = {
      status: newStatus,
      changedAt: new Date(),
    };
    if (newStatus === 'delivered') {
      statusUpdate.deliveryDescription = deliveryDescription;
      statusUpdate.attachmentUrls = uploadedFiles;
    } else if (newStatus === 'requestedRevision') {
      statusUpdate.reason = reason;
      statusUpdate.attachmentUrls = uploadedFiles;
    }
    milestone.statusHistory.push(statusUpdate);

    milestone.status = newStatus;
    await order.save();

    const statusMessages = {
      started: "The milestone has been started.",
      delivered: "The milestone has been delivered.",
      requestedRevision: "The revson request submitteed successfully.",
      approved: "The milestone has been approved.",
    };

    const statusMessage = statusMessages[newStatus] || `Milestone status updated to '${newStatus}'.`;

    return res.status(200).json({
      message: statusMessage,
      milestone,
    });
  } catch (error) {
    console.error('Error updating milestone status:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const createOrderPaypal = async (req, res) => {
  const { amount, currency = 'USD' } = req.body;

  try {
    const { data: { access_token } } = await axios.post(
      `${PAYPAL_API}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        auth: {
          username: PAYPAL_CLIENT_ID,
          password: PAYPAL_SECRET,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const orderResponse = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount,
          },
        }],
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    res.status(200).json({ id: orderResponse.data.id });
  } catch (error) {
    console.error('Error creating PayPal order:', error.message);
    res.status(500).send('Something went wrong');
  }
};

const captureOrder = async (req, res) => {
  const { orderID } = req.body;

  try {
    const { data: { access_token } } = await axios.post(
      `${PAYPAL_API}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        auth: {
          username: PAYPAL_CLIENT_ID,
          password: PAYPAL_SECRET,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const captureResponse = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    res.status(200).json(captureResponse.data);
  } catch (error) {
    console.error('Error capturing PayPal order:', error.message);
    res.status(500).send('Something went wrong');
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find(); // Fetch all orders from the database

    if (!orders) {
      return res.status(404).json({ message: "No orders found" });
    }

    res.status(200).json(orders); // Respond with the user data
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }

}

const getUserOrders = async (req, res) => {
  try {
    const { userId } = req;

    const orders = await Order.find({
      $or: [{ sellerId: userId }, { buyerId: userId }],
      $and: [
        {
          $or: [
            { isCompleted: true },
            { invitationStatus: 'accepted' },
            { status: { $in: ['started', 'in_progress', 'delivered', 'revision'] } }
          ]
        }
      ]
    }).sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(200).json([]); // Return empty array
    }

    const formattedOrders = await Promise.all(orders.map(async (order) => {
        const gig = await Job.findById(order.gigId).select('title photos');
        const buyer = await User.findById(order.buyerId).select('fullName username');
        const seller = await User.findById(order.sellerId).select('fullName username');
        
        let buyerProfile = null;
        let sellerProfile = null;
        try {
           buyerProfile = await UserProfile.findOne({ userId: order.buyerId });
           sellerProfile = await UserProfile.findOne({ userId: order.sellerId });
        } catch (e) {
           console.log("Error fetching profiles in getUserOrders:", e);
        }

        return {
          _id: order._id,
          status: order.status,
          progress: order.progress,
          price: order.price,
          createdAt: order.createdAt,
          deliveryDate: order.deliveryDate,
          isUserSeller: order.sellerId?.toString() === userId?.toString(),
          isUserBuyer: order.buyerId?.toString() === userId?.toString(),
          gig: {
            title: gig?.title || "Gig Unavailable", 
            image: gig?.photos?.[0] || null
          },
          buyer: {
            name: buyer?.fullName || buyer?.username || "Unknown User",
            image: buyerProfile?.profilePicture || null
          },
          seller: {
             name: seller?.fullName || seller?.username || "Unknown User",
             image: sellerProfile?.profilePicture || null
          },
          latestTimelineEvent: order.timeline?.[order.timeline.length - 1]
       };
    }));

    res.status(200).json(formattedOrders);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const updateOrderPaymentStatus = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, payment_intent: paymentIntentId },
      { isCompleted: true },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found or paymentIntent mismatch" });
    }

    res.status(200).json({ message: "Payment successful, order updated", order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const getSingleOrderDetail = async (req, res) => {
  const { id } = req.params;
  const { userId } = req;
  const { lang } = req.query;

  try {
    const order = await Order.findById(id).exec();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const job = await Job.findOne({ _id: order.gigId }).exec();
    let gigTitle = job ? job.title : null;
    
    // Translate gig title if language is specified and not English
    if (lang && lang !== 'en' && gigTitle) {
      const { translateText } = require('../services/translateService');
      try {
        gigTitle = await translateText(gigTitle, 'en', lang);
      } catch (err) {
        console.log('Translation error for gig title:', err);
      }
    }

    let userDetails = null; // Initialize to null
    let otherPartyDetails = null;

    if (userId == order.buyerId) {
      userDetails = await User.findById(order.sellerId).exec();
      otherPartyDetails = await UserProfile.findOne({ userId: order.sellerId }).exec();
    } else if (userId == order.sellerId) {
      userDetails = await User.findById(order.buyerId).exec();
      otherPartyDetails = await UserProfile.findOne({ userId: order.buyerId }).exec();
    }

    const review = await Review.findOne({ orderId: order._id.toString() });
    let reviewDetails = null;
    if (review) {
      reviewDetails = { desc: review.desc, rating: review.star };
    }

    const orderDetails = {
      orderId: order._id,
      gigTitle: gigTitle || 'Gig title unavailable', // Fallback if gigTitle is null
      orderStatus: order.status,
      orderPrice: order.price,
      requirements: order.orderRequirements,
      attachments: order.attachments,
      deliveryDescription: order.deliveryDescription || "Not delivered yet",
      orderType: order.type,
      statusHistory: order.statusHistory,
      orderDate: order.createdAt,
      createdAt: order.createdAt, // Also include createdAt directly
      deliveryDate: order.deliveryDate,
      sellerId: order.sellerId,
      buyerId: order.buyerId,
      timeline: order.timeline || [],
      orderCompletionDate: order.orderCompletionDate,
      isPaid: order.isPaid,
      progress: order.progress
    };

    let milestones = [];
    if (order.isMilestone) {
      milestones = order.milestones || [];
    }


    const userDetailsResponse = userDetails
      ? {
        userName: userDetails.fullName,
        userUsername: userDetails.username,
        userImage: otherPartyDetails ? otherPartyDetails.profilePicture : 'default-image.jpg',
      }
      : null;

    const response = {
      ...(userDetailsResponse && { userDetails: userDetailsResponse }),
      orderDetails,
      ...(milestones.length > 0 && { milestones }),
      ...(reviewDetails && { reviewDetails }),
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getPaymentsSummary = async (req, res) => {
  try {
    const completedOrders = await Order.find({ isCompleted: true });

    const currentDate = dayjs();
    const paymentsSummary = Array.from({ length: 6 }, (_, i) => {
      const month = currentDate.subtract(i, 'month');
      return {
        name: month.format('MMMM'),
        Total: 0,
      };
    });

    completedOrders.forEach(order => {
      const orderMonth = dayjs(order.createdAt).format('MMMM');
      const foundMonth = paymentsSummary.find(item => item.name === orderMonth);
      if (foundMonth) {
        foundMonth.Total += order.price;
      }
    });

    paymentsSummary.reverse();

    res.status(200).json(paymentsSummary);
  } catch (error) {
    console.error('Error fetching payments summary:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateOrders = async (req, res) => {
  try {
    const orders = await Order.find();

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found to update" });
    }

    for (const order of orders) {
      let updateFields = {};

      if (typeof order.gigId === "string" && mongoose.Types.ObjectId.isValid(order.gigId)) {
        updateFields.gigId = new mongoose.Types.ObjectId(order.gigId);
      }

      if (typeof order.sellerId === "string" && mongoose.Types.ObjectId.isValid(order.sellerId)) {
        updateFields.sellerId = new mongoose.Types.ObjectId(order.sellerId);
      }

      if (typeof order.buyerId === "string" && mongoose.Types.ObjectId.isValid(order.buyerId)) {
        updateFields.buyerId = new mongoose.Types.ObjectId(order.buyerId);
      }

      if (Object.keys(updateFields).length > 0) {

        await Order.updateOne(
          { _id: order._id },
          { $set: updateFields },
          { strict: false } // Force update for existing fields
        );
      }
    }

    res.status(200).json({ message: "Orders updated successfully!" });
  } catch (error) {
    console.error("Error updating orders:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const createOrderInvitation = async (req, res) => {
  try {
    const { userId } = req;
    const { gigId, price, message, planTitle, deliveryTime } = req.body;

    if (!gigId || !price || !userId) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    const gig = await Job.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: "Gig not found." });
    }

    if (gig.sellerId?.toString() === userId?.toString()) {
      return res.status(400).json({ message: "You cannot order your own gig." });
    }

    const buyer = await User.findById(userId);
    if (!buyer) {
      return res.status(404).json({ message: "User not found." });
    }

    let orderPrice = price;
    if (gig.discount && gig.discount > 0) {
      orderPrice -= orderPrice * (gig.discount / 100);
    }

    const vatResult = await getVATForUser(userId, orderPrice, 'EUR');
    const vatBreakdown = vatResult.breakdown || {
      baseAmount: orderPrice,
      vatRate: 0,
      vatAmount: 0,
      platformFee: orderPrice * PLATFORM_FEE_RATE,
      totalAmount: orderPrice,
      clientCountry: null,
      vatCollected: false,
      reverseChargeApplied: false
    };

    let deliveryDate = null;
    if (deliveryTime) {
      deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + parseInt(deliveryTime));
    }

    const newInvitation = new Order({
      gigId: gigId,
      price: orderPrice,
      feeAndTax: vatBreakdown.vatAmount + vatBreakdown.platformFee, // Legacy field
      sellerId: String(gig.sellerId).trim(),
      buyerId: String(userId).trim(),
      status: 'pending',
      isInvitation: true,
      invitationStatus: 'pending',
      invitationMessage: message || '',
      selectedPlanTitle: planTitle || '',
      selectedPlanDeliveryTime: deliveryTime || '',
      deliveryDate: deliveryDate,
      type: 'simple',
      progress: 0,
      
      baseAmount: vatBreakdown.baseAmount,
      vatRate: vatBreakdown.vatRate,
      vatAmount: vatBreakdown.vatAmount,
      platformFee: vatBreakdown.platformFee,
      platformFeeRate: PLATFORM_FEE_RATE,
      totalAmount: vatBreakdown.totalAmount,
      currency: 'EUR',
      clientCountry: vatBreakdown.clientCountry,
      vatCollected: vatBreakdown.vatCollected,
      reverseChargeApplied: vatBreakdown.reverseChargeApplied,
      reverseChargeNote: vatBreakdown.reverseChargeNote,
      paymentStatus: 'pending',
      
      timeline: [{
        event: 'Order Placed',
        description: `${buyer.fullName || buyer.username} placed an order for ${planTitle || 'service'}`,
        timestamp: new Date(),
        actor: 'buyer'
      }]
    });

    const savedInvitation = await newInvitation.save();
    
    try {
      const conversationId = gig.sellerId + userId;
      const existingConversation = await Conversation.findOne({ id: conversationId });
      
      if (!existingConversation) {
        const newConversation = new Conversation({
          id: conversationId,
          sellerId: gig.sellerId,
          buyerId: userId,
          readBySeller: false,
          readByBuyer: true,
          lastMessage: `Order invitation for: ${gig.title} - ${planTitle}`,
        });
        await newConversation.save();
      } else {
        existingConversation.lastMessage = `New order invitation for: ${gig.title} - ${planTitle}`;
        existingConversation.readBySeller = false;
        await existingConversation.save();
      }
      
      const Message = require('../models/Message');
      const orderMessage = new Message({
        conversationId: conversationId,
        userId: userId,
        desc: message || `Order invitation for: ${gig.title}`,
        messageType: 'order_invitation',
        orderId: savedInvitation._id,
        orderData: {
          gigTitle: gig.title,
          gigImage: gig.photos && gig.photos.length > 0 ? gig.photos[0] : null,
          planTitle: planTitle || 'Standard',
          price: orderPrice,
          deliveryTime: deliveryTime || '',
          status: 'pending',
          invitationStatus: 'pending'
        }
      });
      await orderMessage.save();
      
    } catch (convError) {
      }

    try {
      await notificationService.createNotification({
        userId: gig.sellerId,
        title: '📋 New Order Invitation',
        message: `${buyer.fullName || buyer.username} has sent you an order invitation for "${gig.title}"`,
        type: 'order',
        link: '/chat',
        data: { 
          orderId: savedInvitation._id, 
          buyerId: userId,
          gigId: gigId
        }
      });
    } catch (notifError) {
      }

    res.status(201).json({
      message: "Order invitation sent successfully! The seller will review and respond to your request.",
      invitation: savedInvitation,
    });
  } catch (error) {
    console.error("Error creating order invitation:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const getSellerInvitations = async (req, res) => {
  try {
    const { userId } = req;
    
    const invitations = await Order.find({
      sellerId: userId,
      isInvitation: true,
      invitationStatus: 'pending'
    }).sort({ createdAt: -1 });

    const populatedInvitations = await Promise.all(
      invitations.map(async (inv) => {
        const buyer = await User.findById(inv.buyerId).select('name email');
        const buyerProfile = await UserProfile.findOne({ userId: inv.buyerId }).select('avatar');
        const gig = await Job.findById(inv.gigId).select('title images');
        
        return {
          ...inv.toObject(),
          buyer: {
            ...buyer?.toObject(),
            avatar: buyerProfile?.avatar
          },
          gig: gig
        };
      })
    );

    res.status(200).json(populatedInvitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const acceptInvitation = async (req, res) => {
  try {
    const { userId } = req;
    const { invitationId } = req.body;

    if (!invitationId) {
      return res.status(400).json({ message: "Invitation ID is required." });
    }

    const invitation = await Order.findById(invitationId);
    
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    const invitationSellerId = invitation.sellerId?.toString().trim();
    const currentUserId = userId?.toString().trim();
    const isSeller = invitationSellerId === currentUserId;
    
    const isAdmin = req.isAdmin === true || req.userRole === 'admin' || req.user?.role === 'admin';

    if (!isSeller && !isAdmin) {
      console.log(`Auth Failed: User ${currentUserId} attempted to accept invitation meant for ${invitationSellerId}`);
      return res.status(403).json({ 
        message: "Unauthorized. You are not the seller this invitation was sent to.",
        debug: { userId: currentUserId, sellerId: invitationSellerId }
      });
    }

    if (invitation.invitationStatus !== 'pending') {
      return res.status(400).json({ message: "This invitation has already been processed." });
    }

    invitation.invitationStatus = 'accepted';
    invitation.status = 'accepted'; // Order accepted by seller
    
    const seller = await User.findById(userId);
    invitation.timeline.push({
      event: 'Order Accepted',
      description: `${seller?.fullName || seller?.username} accepted the order and is ready to start working`,
      timestamp: new Date(),
      actor: 'seller'
    });
    
    invitation.statusHistory.push({
      status: 'accepted',
      changedAt: new Date()
    });
    
    await invitation.save();

    const gig = await Job.findById(invitation.gigId);
    const conversationId = userId + invitation.buyerId;
    
    try {
      const conversation = await Conversation.findOne({ id: conversationId });
      if (conversation) {
        conversation.lastMessage = `Order invitation accepted! Please proceed with payment for: ${gig?.title}`;
        conversation.readByBuyer = false;
        await conversation.save();
      }
      
      const Message = require('../models/Message');
      const acceptedMessage = new Message({
        conversationId: conversationId,
        userId: userId,
        desc: `Order invitation accepted! Please proceed with payment for: ${gig?.title}`,
        messageType: 'order_accepted',
        orderId: invitation._id,
        orderData: {
          gigTitle: gig?.title,
          gigImage: gig?.photos && gig.photos.length > 0 ? gig.photos[0] : null,
          planTitle: invitation.selectedPlanTitle || 'Standard',
          price: invitation.price,
          deliveryTime: invitation.selectedPlanDeliveryTime || '',
          status: 'accepted',
          invitationStatus: 'accepted'
        }
      });
      await acceptedMessage.save();
      
      await Message.updateMany(
        { orderId: invitation._id, messageType: 'order_invitation' },
        { 'orderData.invitationStatus': 'accepted', 'orderData.status': 'accepted' }
      );
      try {
        const buyerUser = await User.findById(invitation.buyerId);
        if (buyerUser && buyerUser.email) {
          await sendOrderAcceptedEmail(buyerUser.email, {
            _id: invitation._id,
            buyerName: buyerUser.fullName || buyerUser.username,
            gigTitle: gig?.title || 'Gig',
            price: invitation.price
          });
          console.log(`✅ Order accepted email sent to: ${buyerUser.email}`);
        }
      } catch (emailErr) {
        console.error('Failed to send order acceptance email:', emailErr.message);
      }
    } catch (err) {
      }

    try {
      await notificationService.notifyAdminOrderAccepted(
        invitation._id.toString(),
        gig?.title || 'Order',
        userId,
        seller?.fullName || seller?.username || 'Seller',
        invitation.price || 0
      );
    } catch (adminNotifyErr) {
      console.error('Failed to notify admins about order acceptance:', adminNotifyErr);
    }

    res.status(200).json({
      message: "Invitation accepted! The buyer can now proceed with payment.",
      invitation: invitation
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const rejectInvitation = async (req, res) => {
  try {
    const { userId } = req;
    const { invitationId, reason } = req.body;

    const invitation = await Order.findById(invitationId);
    
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    const invitationSellerId = invitation.sellerId?.toString().trim();
    const invitationBuyerId = invitation.buyerId?.toString().trim();
    const currentUserId = userId?.toString().trim();

    const isSeller = invitationSellerId === currentUserId;
    const isBuyer = invitationBuyerId === currentUserId;
    
    const isAdmin = req.isAdmin === true || req.userRole === 'admin' || req.user?.role === 'admin';
    
    if (!isSeller && !isBuyer && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized to reject this invitation." });
    }

    if (invitation.invitationStatus !== 'pending') {
      return res.status(400).json({ message: "This invitation has already been processed." });
    }

    invitation.invitationStatus = 'rejected';
    invitation.rejectionReason = reason || '';
    invitation.status = 'cancelled';
    await invitation.save();

    const gig = await Job.findById(invitation.gigId);
    const conversationId = userId + invitation.buyerId;
    
    try {
      const conversation = await Conversation.findOne({ id: conversationId });
      if (conversation) {
        conversation.lastMessage = `Order invitation declined for: ${gig?.title}. ${reason ? `Reason: ${reason}` : ''}`;
        conversation.readByBuyer = false;
        await conversation.save();
      }
      
      const Message = require('../models/Message');
      const rejectedMessage = new Message({
        conversationId: conversationId,
        userId: userId,
        desc: `Order invitation declined for: ${gig?.title}. ${reason ? `Reason: ${reason}` : 'No reason provided.'}`,
        messageType: 'order_rejected',
        orderId: invitation._id,
        orderData: {
          gigTitle: gig?.title,
          gigImage: gig?.photos && gig.photos.length > 0 ? gig.photos[0] : null,
          planTitle: invitation.selectedPlanTitle || 'Standard',
          price: invitation.price,
          status: 'cancelled',
          invitationStatus: 'rejected'
        }
      });
      await rejectedMessage.save();
      
      await Message.updateMany(
        { orderId: invitation._id, messageType: 'order_invitation' },
        { 'orderData.invitationStatus': 'rejected', 'orderData.status': 'cancelled' }
      );
      try {
        const buyerUser = await User.findById(invitation.buyerId);
        if (buyerUser && buyerUser.email) {
          await sendOrderRejectedEmail(buyerUser.email, {
            _id: invitation._id,
            buyerName: buyerUser.fullName || buyerUser.username,
            gigTitle: gig?.title || 'Gig',
            reason: reason || 'No specific reason provided'
          });
          console.log(`❌ Order rejected email sent to: ${buyerUser.email}`);
        }
      } catch (emailErr) {
        console.error('Failed to send order rejection email:', emailErr.message);
      }
    } catch (err) {
      }

    try {
      const seller = await User.findById(userId);
      await notificationService.notifyAdminOrderRejected(
        invitation._id.toString(),
        gig?.title || 'Order',
        userId,
        seller?.fullName || seller?.username || 'Seller',
        reason || 'No reason provided'
      );
    } catch (adminNotifyErr) {
      console.error('Failed to notify admins about order rejection:', adminNotifyErr);
    }

    res.status(200).json({
      message: "Invitation rejected.",
      invitation: invitation
    });
  } catch (error) {
    console.error("Error rejecting invitation:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const getBuyerInvitations = async (req, res) => {
  try {
    const { userId } = req;
    
    const invitations = await Order.find({
      buyerId: userId,
      isInvitation: true
    }).sort({ createdAt: -1 });

    const populatedInvitations = await Promise.all(
      invitations.map(async (inv) => {
        const seller = await User.findById(inv.sellerId).select('name email');
        const sellerProfile = await UserProfile.findOne({ userId: inv.sellerId }).select('avatar');
        const gig = await Job.findById(inv.gigId).select('title images');
        
        return {
          ...inv.toObject(),
          seller: {
            ...seller?.toObject(),
            avatar: sellerProfile?.avatar
          },
          gig: gig
        };
      })
    );

    res.status(200).json(populatedInvitations);
  } catch (error) {
    console.error("Error fetching buyer invitations:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const updateOrderProgress = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId, progress, note } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.sellerId !== userId) {
      return res.status(403).json({ message: "Only the seller can update progress." });
    }

    const progressValue = Math.min(100, Math.max(0, parseInt(progress)));
    order.progress = progressValue;

    let eventName = 'Progress Update';
    if (progressValue === 50) {
      eventName = 'Halfway Complete';
      order.status = 'halfwayDone';
    } else if (progressValue === 100) {
      eventName = 'Ready for Delivery';
    }

    order.timeline.push({
      event: eventName,
      description: note || `Progress updated to ${progressValue}%`,
      timestamp: new Date(),
      actor: 'seller'
    });

    if (progressValue === 50 || progressValue === 100) {
      order.statusHistory.push({
        status: progressValue === 50 ? 'halfwayDone' : 'delivered',
        changedAt: new Date()
      });
    }

    await order.save();

    res.status(200).json({
      message: `Progress updated to ${progressValue}%`,
      order
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const getOrderTimeline = async (req, res) => {
  try {
    const { userId } = req;
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      return res.status(403).json({ message: "Not authorized to view this order." });
    }

    const gig = await Job.findById(order.gigId).select('title photos');
    
    const buyer = await User.findById(order.buyerId).select('fullName username');
    const seller = await User.findById(order.sellerId).select('fullName username');
    const buyerProfile = await UserProfile.findOne({ userId: order.buyerId });
    const sellerProfile = await UserProfile.findOne({ userId: order.sellerId });

    let deadlineInfo = null;
    if (order.deliveryDate) {
      const now = new Date();
      const deadline = new Date(order.deliveryDate);
      const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      deadlineInfo = {
        deadline: order.deliveryDate,
        daysRemaining,
        isOverdue: daysRemaining < 0
      };
    }

    res.status(200).json({
      orderId: order._id,
      status: order.status,
      progress: order.progress,
      price: order.price,
      isCompleted: order.isCompleted,
      isPaid: order.isPaid,
      isReviewed: order.isReviewed,
      timeline: order.timeline,
      statusHistory: order.statusHistory,
      deadlineInfo,
      gig: {
        title: gig?.title,
        image: gig?.photos?.[0]
      },
      buyer: {
        name: buyer?.fullName || buyer?.username,
        image: buyerProfile?.profilePicture
      },
      seller: {
        name: seller?.fullName || seller?.username,
        image: sellerProfile?.profilePicture
      },
      createdAt: order.createdAt,
      completionDate: order.orderCompletionDate,
      completionTime: order.completionTime,
      deadlineMet: order.deadlineMet
    });
  } catch (error) {
    console.error("Error fetching timeline:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const completeOrderWithPayment = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.buyerId !== userId) {
      return res.status(403).json({ message: "Only the buyer can make payment." });
    }

    if (order.status !== 'waitingReview' && order.status !== 'readyForPayment') {
      return res.status(400).json({ 
        message: "Order must be approved before payment.",
        currentStatus: order.status 
      });
    }

    const buyer = await User.findById(userId);
    if (!buyer) {
      return res.status(404).json({ message: "User not found." });
    }

    const rate = await getVatRate(userId);
    const totalAmountWithFeesAndTax = getAmountWithFeeAndTax(order.price, rate);

    const additionalData = { 
      orderId: order._id.toString(), 
      userId, 
      vatRate: rate,
      paymentType: 'order_completion'
    };

    const paymentIntentResponse = await createCustomerAndPaymentIntentUtil(
      totalAmountWithFeesAndTax, 
      buyer.email, 
      "order_payment", 
      additionalData
    );

    if (!paymentIntentResponse) {
      return res.status(500).json({ message: "Failed to create payment intent." });
    }

    const { client_secret, payment_intent } = paymentIntentResponse;

    order.payment_intent = payment_intent;
    order.status = 'readyForPayment';
    
    order.timeline.push({
      event: 'Payment Initiated',
      description: 'Buyer initiated payment for completed work',
      timestamp: new Date(),
      actor: 'buyer'
    });

    await order.save();

    res.status(200).json({
      message: "Payment intent created. Proceed to payment.",
      client_secret,
      amount: totalAmountWithFeesAndTax
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const submitReview = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId, rating, review, communicationRating, qualityRating, deliveryRating } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.buyerId !== userId) {
      return res.status(403).json({ message: "Only the buyer can submit a review." });
    }

    if (!order.isCompleted) {
      return res.status(400).json({ message: "Order must be completed before reviewing." });
    }

    if (order.isReviewed) {
      return res.status(400).json({ message: "You have already reviewed this order." });
    }

    const reviewer = await User.findById(userId);
    const reviewerProfile = await UserProfile.findOne({ userId });

    const newReview = new Review({
      gigId: order.gigId,
      orderId: order._id.toString(),
      userId: userId,
      sellerId: order.sellerId,
      star: rating,
      desc: review,
      communicationRating: communicationRating || rating,
      qualityRating: qualityRating || rating,
      deliveryRating: deliveryRating || rating,
      reviewerName: reviewer?.fullName || reviewer?.username,
      reviewerImage: reviewerProfile?.profilePicture,
      completionTime: order.completionTime,
      deadlineMet: order.deadlineMet
    });

    const savedReview = await newReview.save();

    order.isReviewed = true;
    order.reviewId = savedReview._id;
    
    order.timeline.push({
      event: 'Review Submitted',
      description: `Buyer rated ${rating} stars`,
      timestamp: new Date(),
      actor: 'buyer'
    });

    await order.save();

    try {
      const sellerProfile = await UserProfile.findOne({ userId: order.sellerId });
      if (sellerProfile) {
        const allSellerReviews = await Review.find({ sellerId: order.sellerId });
        const totalRatings = allSellerReviews.reduce((sum, r) => sum + r.star, 0);
        const avgRating = totalRatings / allSellerReviews.length;
        
        sellerProfile.averageRating = Math.round(avgRating * 10) / 10;
        sellerProfile.totalReviews = allSellerReviews.length;
        
        const completedOnTime = await Order.countDocuments({ 
          sellerId: order.sellerId, 
          deadlineMet: true 
        });
        sellerProfile.onTimeDeliveryRate = Math.round((completedOnTime / allSellerReviews.length) * 100);
        
        await sellerProfile.save();
      }
    } catch (profileError) {
      }

    res.status(201).json({
      message: "Review submitted successfully!",
      review: savedReview
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const getActiveOrders = async (req, res) => {
  try {
    const { userId } = req;

    const activeOrders = await Order.find({
      $or: [{ sellerId: userId }, { buyerId: userId }],
      status: { 
        $nin: ['completed', 'cancelled'] 
      }
    }).sort({ createdAt: -1 });

    const populatedOrders = await Promise.all(
      activeOrders.map(async (order) => {
        const gig = await Job.findById(order.gigId).select('title photos');
        const buyer = await User.findById(order.buyerId).select('fullName username');
        const seller = await User.findById(order.sellerId).select('fullName username');
        const buyerProfile = await UserProfile.findOne({ userId: order.buyerId });
        const sellerProfile = await UserProfile.findOne({ userId: order.sellerId });

        let deadlineInfo = null;
        if (order.deliveryDate) {
          const now = new Date();
          const deadline = new Date(order.deliveryDate);
          const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
          deadlineInfo = {
            deadline: order.deliveryDate,
            daysRemaining,
            isOverdue: daysRemaining < 0
          };
        }

        return {
          _id: order._id,
          status: order.status,
          progress: order.progress,
          price: order.price,
          createdAt: order.createdAt,
          deliveryDate: order.deliveryDate,
          deadlineInfo,
          isUserSeller: order.sellerId?.toString() === userId?.toString(),
          isUserBuyer: order.buyerId?.toString() === userId?.toString(),
          gig: {
            title: gig?.title,
            image: gig?.photos?.[0]
          },
          buyer: {
            name: buyer?.fullName || buyer?.username,
            image: buyerProfile?.profilePicture
          },
          seller: {
            name: seller?.fullName || seller?.username,
            image: sellerProfile?.profilePicture
          },
          latestTimelineEvent: order.timeline?.[order.timeline.length - 1]
        };
      })
    );

    res.status(200).json(populatedOrders);
  } catch (error) {
    console.error("Error fetching active orders:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const approveDelivery = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.buyerId !== userId) {
      return res.status(403).json({ message: "Only the buyer can approve delivery." });
    }

    if (order.status !== 'delivered' && order.status !== 'waitingReview') {
      return res.status(400).json({ 
        message: "Order must be in delivered state to approve.",
        currentStatus: order.status 
      });
    }

    const buyer = await User.findById(userId);

    order.status = 'completed';
    order.isCompleted = true;
    order.orderCompletionDate = new Date();
    order.progress = 100;
    
    order.calculateCompletionStats();

    order.timeline.push({
      event: 'Order Completed',
      description: `${buyer?.fullName || buyer?.username} approved the delivery and marked the order as complete`,
      timestamp: new Date(),
      actor: 'buyer'
    });

    order.statusHistory.push({
      status: 'completed',
      changedAt: new Date()
    });

    await order.save();
    
    try {
      const baseEarnings = getSellerPayout(order.price);
      
      const extensions = await TimelineExtension.find({ orderId: order._id, status: 'completed' });
      const extensionRevenueSum = extensions.reduce((acc, ext) => acc + (ext.freelancerRevenue || 0), 0);
      
      const totalEarningsToAdd = baseEarnings + extensionRevenueSum;

      await User.findByIdAndUpdate(order.sellerId, {
        $inc: { 
          "revenue.total": baseEarnings,
          "revenue.available": totalEarningsToAdd,
          "revenue.pending": -extensionRevenueSum
        }
      });
      } catch (revError) {
      console.error('Error updating seller revenue in approveDelivery:', revError);
    }

    try {
      const Message = require('../models/Message');
      const conversationId = order.sellerId + order.buyerId;
      const gig = await Job.findById(order.gigId);
      
      const completedMessage = new Message({
        conversationId: conversationId,
        userId: userId,
        desc: `Order completed! ${buyer?.fullName || buyer?.username} has approved the delivery for "${gig?.title}". Thank you for using Noretmy!`,
        messageType: 'order_update',
        orderId: order._id,
        orderData: {
          gigTitle: gig?.title,
          status: 'completed',
        }
      });
      await completedMessage.save();

      const Conversation = require('../models/Conversation');
      await Conversation.findOneAndUpdate(
        { id: conversationId },
        { 
          lastMessage: `Order completed for: ${gig?.title}`,
          readBySeller: false 
        }
      );
    } catch (msgError) {
      }

    try {
      const sellerProfile = await UserProfile.findOne({ userId: order.sellerId });
      if (sellerProfile) {
        sellerProfile.completedOrders = (sellerProfile.completedOrders || 0) + 1;
        sellerProfile.totalEarnings = (sellerProfile.totalEarnings || 0) + order.price;
        await sellerProfile.save();
      }
    } catch (profileError) {
      }

    try {
      await badgeService.updateSellerMetricsOnOrderComplete(order.sellerId, order);
    } catch (badgeError) {
      }

    res.status(200).json({
      message: "Order completed successfully! You can now leave a review.",
      order: {
        _id: order._id,
        status: order.status,
        isCompleted: order.isCompleted,
        completionTime: order.completionTime,
        deadlineMet: order.deadlineMet
      }
    });
  } catch (error) {
    console.error("Error approving delivery:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const approveProgress = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId, milestone } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.buyerId !== userId) {
      return res.status(403).json({ message: "Only the buyer can approve progress." });
    }

    const buyer = await User.findById(userId);
    const milestoneLabel = milestone === 'halfway' ? '50% Progress' : milestone;

    order.timeline.push({
      event: `${milestoneLabel} Approved`,
      description: `${buyer?.fullName || buyer?.username} approved the ${milestoneLabel} milestone`,
      timestamp: new Date(),
      actor: 'buyer'
    });

    if (milestone === 'halfway') {
      order.statusHistory.push({
        status: 'halfwayApproved',
        changedAt: new Date()
      });
    }

    await order.save();

    res.status(200).json({
      message: `${milestoneLabel} approved successfully!`,
      order
    });
  } catch (error) {
    console.error("Error approving progress:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const advanceOrderStatus = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId, targetStatus } = req.body;

    if (!orderId || !targetStatus) {
      return res.status(400).json({ message: "Order ID and target status are required." });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const isBuyer = order.buyerId?.toString() === userId?.toString();
    const isSeller = order.sellerId?.toString() === userId?.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: "Only the buyer or seller can advance order status." });
    }

    const user = await User.findById(userId);
    const userRole = isBuyer ? 'buyer' : 'seller';

    const statusFlow = [
      'created',           // 0 - Order placed
      'accepted',          // 1 - Freelancer accepts
      'requirementsSubmitted', // 2 - Buyer submits requirements
      'started',           // 3 - Work in progress
      'halfwayDone',       // 4 - Optional halfway point
      'delivered',         // 5 - Work delivered
      'waitingReview',     // 6 - Waiting for review/approval
      'readyForPayment',   // 7 - Ready for final payment
      'completed'          // 8 - Done
    ];

    const currentIndex = statusFlow.indexOf(order.status);
    const targetIndex = statusFlow.indexOf(targetStatus);

    if (currentIndex === -1 || targetIndex === -1) {
      return res.status(400).json({ message: "Invalid status transition." });
    }

    if (targetIndex <= currentIndex) {
      return res.status(400).json({ message: "Cannot move to a previous or same status." });
    }

    const statusPermissions = {
      'accepted': { role: 'seller', description: 'Order accepted by freelancer' },
      'started': { role: 'seller', description: 'Work started by freelancer' },
      'halfwayDone': { role: 'seller', description: 'Halfway progress reached' },
      'delivered': { role: 'seller', description: 'Work delivered by freelancer' },
      
      'requirementsSubmitted': { role: 'buyer', description: 'Requirements submitted by client' },
      'waitingReview': { role: 'buyer', description: 'Work approved by client, awaiting review' },
      'readyForPayment': { role: 'buyer', description: 'Client approved work, ready for payment' },
      'completed': { role: 'buyer', description: 'Order completed with payment' } // Buyer can now complete!
    };

    const permission = statusPermissions[targetStatus];
    
    if (permission) {
      if (permission.role !== userRole) {
        const requiredRole = permission.role === 'seller' ? 'freelancer' : 'client';
        return res.status(403).json({ 
          message: `Only the ${requiredRole} can advance to '${targetStatus}' status.` 
        });
      }
    }

    if (targetStatus === 'completed') {
      order.status = 'completed';
      order.isCompleted = true;
      order.orderCompletionDate = new Date();
      order.progress = 100;

      order.calculateCompletionStats();

      order.statusHistory.push({
        status: 'completed',
        changedAt: new Date()
      });

      order.timeline.push({
        event: 'Payment Completed',
        description: `${user?.fullName || user?.username} completed the payment`,
        timestamp: new Date(),
        actor: userRole
      });

      await order.save();

      try {
        const baseEarnings = getSellerPayout(order.price);
        
        const extensions = await TimelineExtension.find({ orderId: order._id, status: 'completed' });
        const extensionRevenueSum = extensions.reduce((acc, ext) => acc + (ext.freelancerRevenue || 0), 0);
        
        const totalEarningsToAdd = baseEarnings + extensionRevenueSum;

        await User.findByIdAndUpdate(order.sellerId, {
          $inc: { 
            "revenue.total": baseEarnings,
            "revenue.available": totalEarningsToAdd,
            "revenue.pending": -extensionRevenueSum
          }
        });
        
        } catch (revError) {
        console.error('Error updating seller revenue in advanceOrderStatus:', revError);
      }

      const { notifyPaymentCompleted } = require('../services/notificationService');
      const adminUsers = await User.find({ role: 'admin' }).select('_id');
      
      if (adminUsers.length > 0) {
        await notifyPaymentCompleted(
          order.sellerId,
          adminUsers[0]._id, // Send to first admin
          orderId,
          order.price
        );
      }

      const Notification = require('../models/Notification');
      const gig = await Job.findById(order.gigId);
      
      await Notification.create({
        userId: order.sellerId,
        type: 'payment',
        message: `Payment of $${order.price} received for "${gig?.title || 'order'}". You earned $${getSellerPayout(order.price).toFixed(2)}.`,
        link: `/orders/${orderId}`,
        isRead: false
      });

      try {
        await badgeService.updateSellerMetricsOnOrderComplete(order.sellerId, order);
      } catch (badgeError) {
        console.error('Error updating seller badge metrics:', badgeError);
      }

      return res.status(200).json({
        message: `Order completed! Freelancer received $${getSellerPayout(order.price).toFixed(2)}.`,
        order: {
          _id: order._id,
          previousStatus: 'waitingReview',
          newStatus: order.status,
          freelancerRevenue: getSellerPayout(order.price).toFixed(2)
        }
      });
    }

    const previousStatus = order.status;
    order.status = targetStatus;
    
    order.statusHistory.push({
      status: targetStatus,
      changedAt: new Date()
   });

    const eventDescription = permission?.description || `Order status changed to ${targetStatus}`;
    order.timeline.push({
      event: eventDescription,
      description: `${user?.fullName || user?.username} advanced the order status`,
      timestamp: new Date(),
      actor: userRole
    });

    await order.save();

    const Notification = require('../models/Notification');
    const recipientId = isBuyer ? order.sellerId : order.buyerId;
    const gig = await Job.findById(order.gigId);
    
    await Notification.create({
      userId: recipientId,
      type: 'order',
      message: `Order status updated to "${targetStatus}" for "${gig?. title || 'order'}"`,
      link: `/orders/${orderId}`,
      isRead: false
    });

    res.status(200).json({
      message: `Order status advanced to '${targetStatus}' successfully!`,
      order: {
        _id: order._id,
        previousStatus,
        newStatus: order.status
      }
    });
  } catch (error) {
    console.error("Error advancing order status:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const requestTimelineExtension = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId, additionalDays, reason } = req.body;

    if (!orderId || !additionalDays) {
      return res.status(400).json({ message: "Order ID and additional days are required." });
    }

    if (additionalDays < 1 || additionalDays > 30) {
      return res.status(400).json({ message: "Additional days must be between 1 and 30." });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.buyerId?.toString() !== userId?.toString()) {
      return res.status(403).json({ message: "Only the buyer can extend the timeline." });
    }

    const currentDeliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : new Date();
    const newDeliveryDate = new Date(currentDeliveryDate);
    newDeliveryDate.setDate(newDeliveryDate.getDate() + parseInt(additionalDays));

    const oldDeliveryDate = order.deliveryDate;
    order.deliveryDate = newDeliveryDate;
    
    order.timeline.push({
      event: 'Timeline Extended',
      description: `Buyer extended the deadline by ${additionalDays} day(s). ${reason ? `Reason: ${reason}` : ''}`,
      timestamp: new Date(),
      actor: 'buyer'
    });

    await order.save();

    const gig = await Job.findById(order.gigId);
    const buyer = await User.findById(userId);

    const Notification = require('../models/Notification');
    await Notification.create({
      userId: order.sellerId,
      type: 'order',
      message: `${buyer?.fullName || buyer?.username || 'Buyer'} extended the deadline for "${gig?.title || 'order'}" by ${additionalDays} day(s).`,
      link: `/orders/${orderId}`,
      isRead: false
    });

    await Notification.create({
      userId: null, // Admin notification (global)
      type: 'system',
      message: `Timeline extended for order ${orderId}. New deadline: ${newDeliveryDate.toLocaleDateString()}`,
      link: `/orders/${orderId}`,
      isRead: false,
      isGlobal: true
    });

    try {
      const conversationId = order.sellerId + order.buyerId;
      const conversation = await Conversation.findOne({ id: conversationId });
      if (conversation) {
        conversation.lastMessage = `Deadline extended by ${additionalDays} day(s) for: ${gig?.title || 'order'}`;
        conversation.readBySeller = false;
        await conversation.save();
      }
    } catch (convError) {
      }

    res.status(200).json({
      message: `Timeline extended by ${additionalDays} day(s) successfully!`,
      order: {
        _id: order._id,
        oldDeliveryDate,
        newDeliveryDate: order.deliveryDate,
        additionalDays
      }
    });
  } catch (error) {
    console.error("Error extending timeline:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const completeOrderAfterPayment = async (req, res) => {
  try {
    const { orderId, payment_intent_id } = req.body;
    const { userId } = req;

    if (!payment_intent_id) {
      return res.status(400).json({ message: "Payment intent ID is required" });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    console.log('Payment Intent Status:', paymentIntent.status);
    
    if (paymentIntent.status !== "succeeded" && paymentIntent.status !== "requires_capture") {
      return res.status(400).json({ 
        success: false,
        message: "Payment not successful", 
        status: paymentIntent.status 
      });
    }
    
    if (paymentIntent.status === "requires_capture") {
      console.log('Capturing payment intent...');
      await stripe.paymentIntents.capture(payment_intent_id);
      console.log('Payment captured successfully');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.isPaid = true;
    order.paymentStatus = 'completed';
    order.status = 'started';
    order.isCompleted = true;
    order.progress = 20;
    order.statusHistory.push({ status: 'started', createdAt: Date.now() });
    order.timeline.push({
      event: 'Payment Confirmed',
      description: 'Payment verified and order started',
      timestamp: new Date(),
      actor: 'system'
    });

    await order.save();

    const { getSellerPayout } = require('../services/priceUtil');
    const seller = await User.findById(order.sellerId);
    if (seller) {
      const netEarnings = getSellerPayout(order.price);
      seller.revenue = seller.revenue || { total: 0, available: 0, pending: 0, withdrawn: 0 };
      seller.revenue.total = (seller.revenue.total || 0) + netEarnings;
      seller.revenue.available = (seller.revenue.available || 0) + netEarnings;
      seller.markModified('revenue');
      await seller.save();
      console.log('💰 Seller revenue updated - Total:', seller.revenue.total, 'Available:', seller.revenue.available);

      try {
        const Freelancer = require('../models/Freelancer');
        const freelancer = await Freelancer.findOne({ userId: order.sellerId });
        if (freelancer) {
          freelancer.revenue = freelancer.revenue || { total: 0, pending: 0, available: 0, withdrawn: 0, inTransit: 0 };
          freelancer.revenue.total = (freelancer.revenue.total || 0) + netEarnings;
          freelancer.revenue.available = (freelancer.revenue.available || 0) + netEarnings;
          freelancer.availableBalance = freelancer.revenue.available;
          await freelancer.save();
        }
      } catch (syncError) {
        console.error('Error syncing freelancer revenue on payment:', syncError);
      }
    }

    const notificationService = require('../services/notificationService');
    const gig = await Job.findById(order.gigId);
    const buyer = await User.findById(order.buyerId);
    
    try {
      await notificationService.notifyAdminPaymentReceived(
        order._id.toString(),
        gig?.title || 'Order',
        buyer?.fullName || buyer?.username || 'A client',
        order.price
      );
    } catch (notifyErr) {
      console.error('Failed to notify admins about payment:', notifyErr);
    }

    res.status(200).json({
      success: true,
      message: "Order completed successfully",
      order
    });

  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Cancel order (Buyer initiated after deadline)
 */
const cancelOrder = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required." });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.buyerId?.toString() !== userId?.toString()) {
      return res.status(403).json({ message: "Only the buyer can initiate cancellation." });
    }

    if (['completed', 'delivered', 'cancelled', 'disputed'].includes(order.status)) {
      return res.status(400).json({ 
        message: `Order cannot be cancelled in its current status: ${order.status}`,
        currentStatus: order.status 
      });
    }

    const now = new Date();
    const canCancel = order.deliveryDate && new Date(order.deliveryDate) < now;

    if (!canCancel) {
      return res.status(400).json({ 
        message: "You can only cancel the order after the deadline has passed if the seller hasn't delivered yet." 
      });
    }

    if (order.isMilestone || order.payment_intent) {
      await paymentMilestoneService.processCancellation(order._id, reason || 'Deadline expired', userId);
    } else {
      order.status = 'cancelled';
      order.timeline.push({
        event: 'Order Cancelled',
        description: reason || 'Order cancelled by buyer after deadline expiration.',
        timestamp: new Date(),
        actor: 'buyer'
      });
      await order.save();
    }

    const seller = await User.findById(order.sellerId);
    const gig = await Job.findById(order.gigId);

    try {
      await notificationService.createNotification({
        userId: order.sellerId,
        title: '❌ Order Cancelled',
        message: `The buyer cancelled the order "${gig?.title || 'Order'}" because the deadline expired.`,
        type: 'alert',
        link: `/orders/${order._id}`
      });
    } catch (notifErr) {
      console.error('Failed to notify seller about cancellation:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      orderStatus: 'cancelled'
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  completeOrderAfterPayment, getOrders, getUserOrders, getPaymentsSummary, getSingleOrderDetail, createOrderPaypal, captureOrder, confirmMilestoneOrCustomOrder, getCustomerOrderRequests, addOrderRequirement, startOrder, deliverOrder, requestRevision, acceptOrder, updateMilestoneStatus, updateOrders,
  createOrderInvitation, getSellerInvitations, acceptInvitation, rejectInvitation, getBuyerInvitations,
  updateOrderProgress, completeOrderWithPayment, submitReview, getOrderTimeline, getActiveOrders,
  approveDelivery, approveProgress, requestTimelineExtension, advanceOrderStatus, cancelOrder
};

