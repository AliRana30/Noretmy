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

// VAT Service for EU-compliant VAT calculations
const { getVATForUser, calculateVATBreakdown, PLATFORM_FEE_RATE } = require("../services/vatService");

const PAYPAL_API = process.env.PAYPAL_API || "https://api-m.sandbox.paypal.com";
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

const mongoose = require('mongoose');
const { uploadFiles } = require("../utils/uploadFiles");
const { sendOrderRequestEmail, sendOnboardingEmail, sendOrderDeliveredEmail, sendOrderCompletedEmail } = require("../services/emailService");
const { calculateDeliveryDate } = require("../utils/dateCalculate");

// Badge service for seller level updates
const badgeService = require("../services/badgeService");

// Notification service for user notifications
const notificationService = require("../services/notificationService");

// Controller to create a new order
// const createOrder = async (req, res) => {
//   try {
//     // Extract data from the request body
//     const { userId } = req;
//     const { gigId, price, status, email } = req.body;

//     // Find the gig in the database
//     const gig = await Job.findById(gigId);

//     const orderPrice = price/100;
//     const feeAndTax = (orderPrice * 0.02) +0.35;

//     // Validate required fields
//     if (!gigId || !price || !userId || !status || !email) {
//       return res.status(400).json({ message: "All required fields must be provided." });
//     }

//     // Create a new order in the database
//     const newOrder = new Order({
//       gigId: gigId,
//       price: orderPrice,
//       feeAndTax :feeAndTax,
//       sellerId: gig.sellerId, // Use the sellerId from the gig
//       buyerId: userId, // Use the buyerId from the request
//       status: status, // Initial order status
//       payment_intent: "Temp", // Temporary placeholder for payment intent
//     });

//     // Save the order to the database
//     const savedOrder = await newOrder.save();

//     // Create a payment intent using the helper utility
//     const paymentIntentResponse = await createCustomerAndPaymentIntentUtil(price, email);

//     // Extract the client_secret from the payment intent response
//     const { client_secret, payment_intent } = paymentIntentResponse;

//     // Update the saved order with the actual payment intent ID
//     savedOrder.payment_intent = payment_intent;
//     await savedOrder.save();

//     // Send the response to the frontend
//     res.status(201).json({
//       message: "Order created successfully",
//       order: savedOrder,
//       client_secret: client_secret, // This is used on the frontend to confirm payment
//     });
//   } catch (error) {
//     console.error("Error creating order:", error);
//     res.status(500).json({ message: "Server error. Please try again later." });
//   }
// };

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
    // Validate milestones if it's a milestone order

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

    const feeAndTax = orderPrice * PLATFORM_FEE_RATE;
    const buyerId = (isMilestone || isCustomOrder) ? custom_BuyerId : userId;
    const buyerEmail = (isMilestone || isCustomOrder) ? user.email : user.email;

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

    const newOrder = new Order({
      gigId: gigId,
      price: orderPrice,
      feeAndTax: feeAndTax,
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

    if (!isMilestone && !isCustomOrder) {

      const rate = await getVatRate(userId);
      const additionalData = { orderId: savedOrder._id.toString(), userId, vatRate: rate, discount: gig.discount };

      const paymentIntentResponse = await createCustomerAndPaymentIntentUtil(totalAmountWithFeesAndTax, buyerEmail, "order_payment", additionalData);
      const { client_secret: secret, payment_intent } = paymentIntentResponse;

      savedOrder.payment_intent = payment_intent;
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

    // Auto-create conversation between buyer and seller when order is created
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

// Order Requiremnts submission by buyer
const addOrderRequirement = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId, requirements } = req.body;

    // Find the order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the logged-in user is the buyer
    if (order.buyerId !== userId) {
      return res.status(403).json({ message: 'Unauthorized to update this order' });
    }

    if (order.status !== "created") {
      return res.status(400).json({ message: "Order is not in a valid state to be started" });
    }

    // Handle file uploads
    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      // const uploadResult = await uploadFiles(req);
      if (uploadResult.success) {
        uploadedFiles = uploadResult.urls; // Store uploaded file URLs
      } else {
        return res.status(500).json({ message: 'File upload failed', error: uploadResult.error });
      }
    }

    // Update the order requirements & attachments
    order.orderRequirements = requirements;  // Save text requirements
    order.attachments = uploadedFiles.map(file => file.url);
    order.status = "requirementsSubmitted";

    // Track status change
    const statusUpdate = {
      status: "requirementsSubmitted",
      changedAt: new Date(),
    };
    order.statusHistory.push(statusUpdate);

    await order.save();

    // Send notification to seller
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
    // Find the order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if the user is the seller of the order
    if (order.sellerId.toString() !== userId) {
      return res.status(403).json({ error: "You are not authorized to start this order" });
    }

    // Check if the order status allows starting
    if (order.status !== "requirementsSubmitted" && order.status !== "accepted") {
      return res.status(400).json({ error: "Order is not in a valid state to be started" });
    }

    const seller = await User.findById(userId);
    
    order.status = "started";
    order.progress = 10; // Initial progress
    
    const statusUpdate = {
      status: "started",
      changedAt: new Date(),
    };
    order.statusHistory.push(statusUpdate);
    
    // Add timeline event
    order.timeline.push({
      event: 'Work Started',
      description: `${seller?.fullName || seller?.username} started working on the project`,
      timestamp: new Date(),
      actor: 'seller'
    });

    await order.save();

    // Send notification to buyer
    try {
      const gig = await Job.findById(order.gigId);
      await notificationService.notifyOrderStarted(
        order.buyerId,
        order._id.toString(),
        gig?.title || 'Order'
      );
    } catch (notifError) {
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

    // Find the order by ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if the user is the seller of the order
    if (order.sellerId.toString() !== userId) {
      return res.status(403).json({ error: "You are not authorized to complete this order" });
    }

    if (order.status !== "started" && order.status !== "requestedRevision") {
      return res.status(400).json({ error: "Order is not in a valid state to be delivered" });
    }

    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      // const uploadResult = await uploadFiles(req);
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
    order.progress = 100; // Delivery means 100% progress

    const statusUpdate = {
      status: "delivered",
      changedAt: new Date(),
      deliveryDescription: deliveryDescription,
      deliveryAttachments: uploadedFiles,
    };

    order.statusHistory.push(statusUpdate);
    
    // Add timeline event
    order.timeline.push({
      event: 'Work Delivered',
      description: `${seller?.fullName || seller?.username} delivered the completed work`,
      timestamp: new Date(),
      actor: 'seller'
    });
    
    await order.save();
    
    // Process delivery milestone for payment tracking
    try {
      const paymentMilestoneService = require('../services/paymentMilestoneService');
      await paymentMilestoneService.processDeliveryMilestone(orderId, userId);
    } catch (milestoneError) {
      }

    // Send notification to buyer
    try {
      const gig = await Job.findById(order.gigId);
      await notificationService.notifyOrderDelivered(
        order.buyerId,
        order._id.toString(),
        gig?.title || 'Order'
      );
      
      // Send email notification
      const buyer = await User.findById(order.buyerId);
      if (buyer && buyer.email) {
        await sendOrderDeliveredEmail(buyer.email, {
          customerName: buyer.username || buyer.email,
          orderId: order._id.toString(),
          gigTitle: gig?.title || 'Your Order',
          sellerName: seller?.username || 'The freelancer',
          deliveryDescription
        }).catch(err => {
          console.error("Error sending order delivered email:", err);
        });
      }
    } catch (notifError) {
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

    // Find the order by ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if the user is the seller of the order
    if (order.buyerId.toString() !== userId) {
      return res.status(403).json({ error: "You are not authorized to complete this order" });
    }

    // Check if the order status is 'requirementSubmitted'
    if (order.status !== "delivered") {
      return res.status(400).json({ error: "Order is not in a valid state to be Request revison" });
    }

    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      // const uploadResult = await uploadFiles(req);
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

    // Send notification to seller
    try {
      const gig = await Job.findById(order.gigId);
      await notificationService.notifyRevisionRequested(
        order.sellerId,
        order._id.toString(),
        gig?.title || 'Order',
        reason
      );
    } catch (notifError) {
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

    // Find the order by ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if the user is the seller of the order
    if (order.buyerId.toString() !== userId) {
      return res.status(403).json({ error: "You are not authorized to complete this order" });
    }

    // Check if the order status is 'requirementSubmitted'
    if (order.status !== "delivered" && order.status !== "requestedRevision") {
      return res.status(400).json({ error: "Order is not in a valid state to be accepted " });
    }
    const completionDate = new Date();

    order.status = "completed";
    order.orderCompletionDate = completionDate;
    order.isCompleted = true;
    
    // Calculate completion time and deadline status
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
    
    // Add timeline event
    const buyer = await User.findById(userId);
    order.timeline.push({
      event: 'Work Approved',
      description: `${buyer?.fullName || buyer?.username} approved the delivered work. ${order.deadlineMet ? '✅ Completed on time!' : '⚠️ Completed after deadline'}`,
      timestamp: new Date(),
      actor: 'buyer'
    });

    const gigId = order.gigId;

    const updatedGig = await Job.findByIdAndUpdate(
      gigId,
      {
        $inc: { sales: 1 } // Increment sales by 1
      },
      { new: true } // Return the updated document
    );

    // RELEASE ESCROW FUNDS: Move from pending to available
    try {
      const { getSellerPayout } = require('../services/priceUtil');
      const paymentMilestoneService = require('../services/paymentMilestoneService');
      const Freelancer = require('../models/Freelancer');
      
      const amountToRelease = getSellerPayout(order.price);
      const seller = await User.findById(order.sellerId);
      
      if (seller) {
        seller.revenue.available += amountToRelease;
        seller.revenue.pending = Math.max(0, seller.revenue.pending - amountToRelease);
        await seller.save();
        }
      
      // Also update Freelancer model
      const freelancer = await Freelancer.findOne({ userId: order.sellerId });
      if (freelancer) {
        await freelancer.releaseEarnings(amountToRelease);
      }
      
      // Update order payment breakdown
      order.paymentMilestoneStage = 'completed';
      order.escrowStatus = 'released';
      order.paymentBreakdown = {
        ...order.paymentBreakdown,
        totalReleasedAmount: amountToRelease,
        pendingReleaseAmount: 0,
        escrowAmount: 0
      };
      order.fundsReleasedAt = new Date();
      
      // Process review milestone
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
      
      // Update seller badge metrics
      await badgeService.updateSellerMetricsOnOrderComplete(order.sellerId, order);
    } catch (profileError) {
      }

    await order.save();

    // Send notification to seller that order is completed
    try {
      const gig = await Job.findById(order.gigId);
      const seller = await User.findById(order.sellerId);
      
      await notificationService.notifyOrderCompleted(
        order.buyerId,
        order.sellerId,
        order._id.toString(),
        gig?.title || 'Order'
      );
      
      // Send email notification to seller
      if (seller && seller.email) {
        const { getSellerPayout } = require('../services/priceUtil');
        const amountEarned = getSellerPayout(order.price);
        
        await sendOrderCompletedEmail(seller.email, {
          orderId: order._id.toString(),
          sellerName: seller.username || seller.email,
          buyerName: buyer?.username || 'The client',
          gigTitle: gig?.title || 'Order',
          amount: amountEarned,
          isForSeller: true
        }).catch(err => {
          console.error("Error sending order completed email:", err);
        });
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

    // Query the database for the order
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

    // Get userId from the request and query the user for email
    const user = await User.findById(userId);

    if (!user || !user.email) {
      return res.status(404).json({ message: "User or user email not found." });
    }

    const email = user.email;

    // Get Vat from vat Util
    const rate = await getVatRate(userId);
    const totalAmountWithFeesAndTax = getAmountWithFeeAndTax(price, rate);

    const orderDetails = { userId, orderId, vatRate: rate }

    const paymentIntentResponse = await createCustomerAndPaymentIntentUtil(totalAmountWithFeesAndTax, email, "order_payment", orderDetails);

    if (!paymentIntentResponse) {
      return res.status(500).json({ message: "Failed to create payment intent." });
    }

    const { client_secret, payment_intent } = paymentIntentResponse;

    // Update the order with the payment_intent
    order.payment_intent = payment_intent;
    await order.save();

    // Send response to the frontend
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
    const twentyFourHoursAgo = new Date(now.setHours(now.getHours() - 24));

    // Fetch orders based on the userId and within the last 24 hours, filtering by milestone or custom types
    const orders = await Order.find({
      buyerId: userId,
      createdAt: { $gte: twentyFourHoursAgo },
      isCompleted: false,
      $or: [{ type: "milestone" }, { type: "custom" }],
    });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No recent milestone or custom orders found." });
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

      // Fetch user profile and provide fallback if not found
      const userProfile = await UserProfile.findById(user._id);
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

      // If the order is of type 'custom', just return the baseOrder
      if (order.type === "custom") {
        return baseOrder;
      }

      // If the order is a 'milestone' type, process the milestones array
      if (order.type === "milestone" && Array.isArray(order.milestones)) {
        const milestones = order.milestones.map(milestone => ({
          title: milestone.title,
          description: milestone.description,
          deliveryDate: milestone.deliveryTime,
          price: milestone.amount,
        }));
        return { ...baseOrder, milestones };
      }

      // Fallback if no valid order type is found
      return baseOrder;
    }));

    // Filter out invalid orders with errors
    const validOrders = response.filter(order => !order.error);

    res.status(200).json(validOrders);

  } catch (error) {
    console.error("Error fetching customer order requests:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Update Milestone Status
const updateMilestoneStatus = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId, milestoneId, newStatus, deliveryDescription, reason } = req.body;

    if (!userId) {
      res.status(401).json({ message: "User is not authenticated!" })
    }
    // Validate inputs
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

    // Make sure to start the next milestone after completing the previous one
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
      // const uploadResult = await uploadFiles(req);
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
    // Get access token
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

    // Create order
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
    // Get access token
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

    // Capture payment
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

    // Get orders that are either:
    // 1. Completed (paid) orders
    // 2. Accepted invitations (where invitationStatus is 'accepted')
    // 3. Active orders in progress
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
    })
      .populate({
        path: "gigId",
        model: "Job",
        select: "title photos"
      })
      .populate({
        path: "sellerId",
        model: "User",
        select: "username"
      }).populate({
        path: "buyerId",
        model: "User",
        select: "username"
      })
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    // Format the response to include required fields
    // const formattedOrders = orders.map(order => ({
    //     gigImage: order.gigId?.photos?.[0] || null, // Get the first gig image
    //     price: order.price,
    //     title: order.gigId?.title || "No Title",
    //     username: order.sellerId?.username || "Unknown",
    //     deliveryDate: order.orderCompletionDate || "Pending"
    // }));

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const updateOrderPaymentStatus = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    // Assuming you've already verified the payment success with the payment gateway
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

  try {
    const order = await Order.findById(id).exec();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find the gigTitle from the Job model using gigId from the order
    const job = await Job.findOne({ _id: order.gigId }).exec();
    const gigTitle = job ? job.title : null;

    let userDetails = null; // Initialize to null
    let otherPartyDetails = null;

    // Check if the user is the buyer or seller
    if (userId == order.buyerId) {
      // User is the buyer, fetch the seller's details
      userDetails = await User.findById(order.sellerId).exec();
      otherPartyDetails = await UserProfile.findOne({ userId: order.sellerId }).exec();
    } else if (userId == order.sellerId) {
      // User is the seller, fetch the buyer's details
      userDetails = await User.findById(order.buyerId).exec();
      otherPartyDetails = await UserProfile.findOne({ userId: order.buyerId }).exec();
    }

    const review = await Review.findOne({ orderId: order._id.toString() });
    let reviewDetails = null;
    if (review) {
      reviewDetails = { desc: review.desc, rating: review.star };
    }

    // Prepare the order details
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

    // include milestone with milestone orders
    let milestones = [];
    if (order.isMilestone) {
      milestones = order.milestones || [];
    }

    // Prepare user details if available

    const userDetailsResponse = userDetails
      ? {
        userName: userDetails.fullName,
        userUsername: userDetails.username,
        userImage: otherPartyDetails ? otherPartyDetails.profilePicture : 'default-image.jpg',
      }
      : null;

    // Build the response object
    const response = {
      ...(userDetailsResponse && { userDetails: userDetailsResponse }),
      orderDetails,
      ...(milestones.length > 0 && { milestones }),
      ...(reviewDetails && { reviewDetails }),
    };

    // Return the response
    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getPaymentsSummary = async (req, res) => {
  try {
    const completedOrders = await Order.find({ isCompleted: true });

    // Initialize an array for the last 6 months
    const currentDate = dayjs();
    const paymentsSummary = Array.from({ length: 6 }, (_, i) => {
      const month = currentDate.subtract(i, 'month');
      return {
        name: month.format('MMMM'),
        Total: 0,
      };
    });

    // Accumulate payments into the corresponding month
    completedOrders.forEach(order => {
      const orderMonth = dayjs(order.createdAt).format('MMMM');
      const foundMonth = paymentsSummary.find(item => item.name === orderMonth);
      if (foundMonth) {
        foundMonth.Total += order.price;
      }
    });

    // Reverse the array to show from oldest to newest
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
        // Debugging

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

// Create order invitation (client sends invitation to seller)
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

    // Debug logging for own gig check
    // Check if user is trying to order their own gig
    // Use toString() to handle both ObjectId and string comparisons
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

    // Calculate VAT using VAT service (EU-compliant)
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

    // Calculate delivery date based on delivery time
    let deliveryDate = null;
    if (deliveryTime) {
      deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + parseInt(deliveryTime));
    }

    // Create invitation order with VAT data
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
      
      // VAT fields - calculated by backend
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
    
    // Auto-create conversation between buyer and seller
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
        // Update conversation with invitation message
        existingConversation.lastMessage = `New order invitation for: ${gig.title} - ${planTitle}`;
        existingConversation.readBySeller = false;
        await existingConversation.save();
      }
      
      // Create a message for the order invitation so it shows in chat
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

    // Send notification to seller about new order invitation
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

// Get pending invitations for seller
const getSellerInvitations = async (req, res) => {
  try {
    const { userId } = req;
    
    const invitations = await Order.find({
      sellerId: userId,
      isInvitation: true,
      invitationStatus: 'pending'
    }).sort({ createdAt: -1 });

    // Populate buyer and gig info
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

// Accept invitation (seller accepts)
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

    // Use robust ID comparison
    const isSeller = invitation.sellerId?.toString() === userId?.toString();
    
    // Check for admin role - admins can bypass this check
    // Since we use verifyToken, req.user might be undefined, so we check req.isSeller
    // However, none of the standard verifyToken payloads would make isAdmin true here.
    // We'll rely on the enhanced check if available, or a fallback.
    const isAdmin = req.user?.role === 'admin' || req.isAdmin === true;

    if (!isSeller && !isAdmin) {
      return res.status(403).json({ 
        message: "Unauthorized. You are not the seller this invitation was sent to."
      });
    }

    if (invitation.invitationStatus !== 'pending') {
      return res.status(400).json({ message: "This invitation has already been processed." });
    }

    invitation.invitationStatus = 'accepted';
    invitation.status = 'accepted'; // Order accepted by seller
    
    // Add timeline event
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

    // Notify buyer that invitation was accepted
    const gig = await Job.findById(invitation.gigId);
    const conversationId = userId + invitation.buyerId;
    
    try {
      const conversation = await Conversation.findOne({ id: conversationId });
      if (conversation) {
        conversation.lastMessage = `Order invitation accepted! Please proceed with payment for: ${gig?.title}`;
        conversation.readByBuyer = false;
        await conversation.save();
      }
      
      // Create message for accepted invitation
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
      
      // Update the original invitation message status
      await Message.updateMany(
        { orderId: invitation._id, messageType: 'order_invitation' },
        { 'orderData.invitationStatus': 'accepted', 'orderData.status': 'accepted' }
      );
    } catch (err) {
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

// Reject invitation (seller rejects)
const rejectInvitation = async (req, res) => {
  try {
    const { userId } = req;
    const { invitationId, reason } = req.body;

    const invitation = await Order.findById(invitationId);
    
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    // Allow both seller and buyer to reject/cancel the invitation
    const isSeller = invitation.sellerId?.toString() === userId?.toString();
    const isBuyer = invitation.buyerId?.toString() === userId?.toString();
    
    if (!isSeller && !isBuyer) {
      return res.status(403).json({ message: "Unauthorized to reject this invitation." });
    }

    if (invitation.invitationStatus !== 'pending') {
      return res.status(400).json({ message: "This invitation has already been processed." });
    }

    invitation.invitationStatus = 'rejected';
    invitation.rejectionReason = reason || '';
    invitation.status = 'cancelled';
    await invitation.save();

    // Notify buyer
    const gig = await Job.findById(invitation.gigId);
    const conversationId = userId + invitation.buyerId;
    
    try {
      const conversation = await Conversation.findOne({ id: conversationId });
      if (conversation) {
        conversation.lastMessage = `Order invitation declined for: ${gig?.title}. ${reason ? `Reason: ${reason}` : ''}`;
        conversation.readByBuyer = false;
        await conversation.save();
      }
      
      // Create message for rejected invitation
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
      
      // Update the original invitation message status
      await Message.updateMany(
        { orderId: invitation._id, messageType: 'order_invitation' },
        { 'orderData.invitationStatus': 'rejected', 'orderData.status': 'cancelled' }
      );
    } catch (err) {
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

// Get buyer's invitations (to see status)
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

// Update order progress (0-100%)
const updateOrderProgress = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId, progress, note } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Only seller can update progress
    if (order.sellerId !== userId) {
      return res.status(403).json({ message: "Only the seller can update progress." });
    }

    // Validate progress
    const progressValue = Math.min(100, Math.max(0, parseInt(progress)));
    order.progress = progressValue;

    // Add timeline event
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

    // Update status history
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

// Get order timeline
const getOrderTimeline = async (req, res) => {
  try {
    const { userId } = req;
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Check if user is buyer or seller
    if (order.buyerId !== userId && order.sellerId !== userId) {
      return res.status(403).json({ message: "Not authorized to view this order." });
    }

    // Get gig info
    const gig = await Job.findById(order.gigId).select('title photos');
    
    // Get buyer and seller info
    const buyer = await User.findById(order.buyerId).select('fullName username');
    const seller = await User.findById(order.sellerId).select('fullName username');
    const buyerProfile = await UserProfile.findOne({ userId: order.buyerId });
    const sellerProfile = await UserProfile.findOne({ userId: order.sellerId });

    // Calculate deadline info
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

// Complete order with payment (after work is accepted)
const completeOrderWithPayment = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Only buyer can pay
    if (order.buyerId !== userId) {
      return res.status(403).json({ message: "Only the buyer can make payment." });
    }

    // Check if order is in correct state
    if (order.status !== 'waitingReview' && order.status !== 'readyForPayment') {
      return res.status(400).json({ 
        message: "Order must be approved before payment.",
        currentStatus: order.status 
      });
    }

    // Get buyer email for payment
    const buyer = await User.findById(userId);
    if (!buyer) {
      return res.status(404).json({ message: "User not found." });
    }

    // Get VAT rate and calculate total
    const rate = await getVatRate(userId);
    const totalAmountWithFeesAndTax = getAmountWithFeeAndTax(order.price, rate);

    // Create payment intent
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

    // Update order with payment intent
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

// Submit review after order completion
const submitReview = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId, rating, review, communicationRating, qualityRating, deliveryRating } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Only buyer can review
    if (order.buyerId !== userId) {
      return res.status(403).json({ message: "Only the buyer can submit a review." });
    }

    // Check if order is completed
    if (!order.isCompleted) {
      return res.status(400).json({ message: "Order must be completed before reviewing." });
    }

    // Check if already reviewed
    if (order.isReviewed) {
      return res.status(400).json({ message: "You have already reviewed this order." });
    }

    // Get reviewer info
    const reviewer = await User.findById(userId);
    const reviewerProfile = await UserProfile.findOne({ userId });

    // Create review
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

    // Update order with review
    order.isReviewed = true;
    order.reviewId = savedReview._id;
    
    order.timeline.push({
      event: 'Review Submitted',
      description: `Buyer rated ${rating} stars`,
      timestamp: new Date(),
      actor: 'buyer'
    });

    await order.save();

    // Update freelancer's profile with review stats
    try {
      const sellerProfile = await UserProfile.findOne({ userId: order.sellerId });
      if (sellerProfile) {
        // Calculate average rating
        const allSellerReviews = await Review.find({ sellerId: order.sellerId });
        const totalRatings = allSellerReviews.reduce((sum, r) => sum + r.star, 0);
        const avgRating = totalRatings / allSellerReviews.length;
        
        sellerProfile.averageRating = Math.round(avgRating * 10) / 10;
        sellerProfile.totalReviews = allSellerReviews.length;
        
        // Track completion stats
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

// Get active orders (for timeline display)
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

        // Calculate deadline info
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

// Buyer approves delivery and completes order
const approveDelivery = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Only buyer can approve
    if (order.buyerId !== userId) {
      return res.status(403).json({ message: "Only the buyer can approve delivery." });
    }

    // Check if order is in delivered state
    if (order.status !== 'delivered' && order.status !== 'waitingReview') {
      return res.status(400).json({ 
        message: "Order must be in delivered state to approve.",
        currentStatus: order.status 
      });
    }

    const buyer = await User.findById(userId);

    // Update order status
    order.status = 'completed';
    order.isCompleted = true;
    order.orderCompletionDate = new Date();
    order.progress = 100;
    
    // Calculate completion time
    order.calculateCompletionStats();

    // Add timeline event
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
    
    // Credit money to freelancer's revenue
    try {
      const baseEarnings = getSellerPayout(order.price);
      
      // Move any pending extension revenue to available
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

    // Create a message in the conversation
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

      // Update conversation
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

    // Update freelancer stats
    try {
      const sellerProfile = await UserProfile.findOne({ userId: order.sellerId });
      if (sellerProfile) {
        sellerProfile.completedOrders = (sellerProfile.completedOrders || 0) + 1;
        sellerProfile.totalEarnings = (sellerProfile.totalEarnings || 0) + order.price;
        await sellerProfile.save();
      }
    } catch (profileError) {
      }

    // Update seller badge metrics
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

// Buyer approves progress milestone (e.g., 50% complete)
const approveProgress = async (req, res) => {
  try {
    const { userId } = req;
    const { orderId, milestone } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Only buyer can approve
    if (order.buyerId !== userId) {
      return res.status(403).json({ message: "Only the buyer can approve progress." });
    }

    const buyer = await User.findById(userId);
    const milestoneLabel = milestone === 'halfway' ? '50% Progress' : milestone;

    // Add timeline event
    order.timeline.push({
      event: `${milestoneLabel} Approved`,
      description: `${buyer?.fullName || buyer?.username} approved the ${milestoneLabel} milestone`,
      timestamp: new Date(),
      actor: 'buyer'
    });

    // Update status based on milestone
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

// Client advances order to next stage
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

    // Define allowed status transitions
    // Status flow: created -> accepted -> requirementsSubmitted -> started -> delivered -> waitingReview -> completed
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

    // Cannot go backwards
    if (targetIndex <= currentIndex) {
      return res.status(400).json({ message: "Cannot move to a previous or same status." });
    }

    // Define who can advance to which status
    const statusPermissions = {
      // Seller can do these
      'accepted': { role: 'seller', description: 'Order accepted by freelancer' },
      'started': { role: 'seller', description: 'Work started by freelancer' },
      'halfwayDone': { role: 'seller', description: 'Halfway progress reached' },
      'delivered': { role: 'seller', description: 'Work delivered by freelancer' },
      
      // Buyer can do these
      'requirementsSubmitted': { role: 'buyer', description: 'Requirements submitted by client' },
      'waitingReview': { role: 'buyer', description: 'Work approved by client, awaiting review' },
      'readyForPayment': { role: 'buyer', description: 'Client approved work, ready for payment' },
      'completed': { role: 'buyer', description: 'Order completed with payment' } // Buyer can now complete!
    };

    const permission = statusPermissions[targetStatus];
    
    // Check if the current user can advance to this status
    if (permission) {
      if (permission.role !== userRole) {
        const requiredRole = permission.role === 'seller' ? 'freelancer' : 'client';
        return res.status(403).json({ 
          message: `Only the ${requiredRole} can advance to '${targetStatus}' status.` 
        });
      }
    }

    // SPECIAL HANDLING FOR COMPLETED STATUS
    if (targetStatus === 'completed') {
      // Mark order as completed
      order.status = 'completed';
      order.isCompleted = true;
      order.orderCompletionDate = new Date();
      order.progress = 100;

      // Calculate completion stats
      order.calculateCompletionStats();

      // Add to status history
      order.statusHistory.push({
        status: 'completed',
        changedAt: new Date()
      });

      // Add timeline event
      order.timeline.push({
        event: 'Payment Completed',
        description: `${user?.fullName || user?.username} completed the payment`,
        timestamp: new Date(),
        actor: userRole
      });

      await order.save();

      // Add money to freelancer's revenue using standard payout calculation
      try {
        const baseEarnings = getSellerPayout(order.price);
        
        // Move any pending extension revenue to available
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

      // Send notifications to both parties and admin
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

      // Also send regular notification to seller
      const Notification = require('../models/Notification');
      const gig = await Job.findById(order.gigId);
      
      await Notification.create({
        userId: order.sellerId,
        type: 'payment',
        message: `Payment of $${order.price} received for "${gig?.title || 'order'}". You earned $${getSellerPayout(order.price).toFixed(2)}.`,
        link: `/orders/${orderId}`,
        isRead: false
      });

      // Update seller badge metrics
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

    // NORMAL STATUS ADVANCEMENT (not completed)
    const previousStatus = order.status;
    order.status = targetStatus;
    
    // Add to status history
    order.statusHistory.push({
      status: targetStatus,
      changedAt: new Date()
   });

    // Add timeline event
    const eventDescription = permission?.description || `Order status changed to ${targetStatus}`;
    order.timeline.push({
      event: eventDescription,
      description: `${user?.fullName || user?.username} advanced the order status`,
      timestamp: new Date(),
      actor: userRole
    });

    await order.save();

    // Send notification to the other party
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

// Request timeline extension (buyer can extend deadline)
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

    // Only buyer can extend the timeline
    if (order.buyerId?.toString() !== userId?.toString()) {
      return res.status(403).json({ message: "Only the buyer can extend the timeline." });
    }

    // Calculate new delivery date
    const currentDeliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : new Date();
    const newDeliveryDate = new Date(currentDeliveryDate);
    newDeliveryDate.setDate(newDeliveryDate.getDate() + parseInt(additionalDays));

    // Update order
    const oldDeliveryDate = order.deliveryDate;
    order.deliveryDate = newDeliveryDate;
    
    // Add to timeline
    order.timeline.push({
      event: 'Timeline Extended',
      description: `Buyer extended the deadline by ${additionalDays} day(s). ${reason ? `Reason: ${reason}` : ''}`,
      timestamp: new Date(),
      actor: 'buyer'
    });

    await order.save();

    // Get gig and user info for notifications
    const gig = await Job.findById(order.gigId);
    const buyer = await User.findById(userId);

    // Create notification for seller
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: order.sellerId,
      type: 'order',
      message: `${buyer?.fullName || buyer?.username || 'Buyer'} extended the deadline for "${gig?.title || 'order'}" by ${additionalDays} day(s).`,
      link: `/orders/${orderId}`,
      isRead: false
    });

    // Create notification for admin
    await Notification.create({
      userId: null, // Admin notification (global)
      type: 'system',
      message: `Timeline extended for order ${orderId}. New deadline: ${newDeliveryDate.toLocaleDateString()}`,
      link: `/orders/${orderId}`,
      isRead: false,
      isGlobal: true
    });

    // Update conversation if exists
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

module.exports = {
  createOrder, getOrders, getUserOrders, getPaymentsSummary, getSingleOrderDetail, createOrderPaypal, captureOrder, confirmMilestoneOrCustomOrder, getCustomerOrderRequests, addOrderRequirement, startOrder, deliverOrder, requestRevision, acceptOrder, updateMilestoneStatus, updateOrders,
  createOrderInvitation, getSellerInvitations, acceptInvitation, rejectInvitation, getBuyerInvitations,
  updateOrderProgress, completeOrderWithPayment, submitReview, getOrderTimeline, getActiveOrders,
  approveDelivery, approveProgress, requestTimelineExtension, advanceOrderStatus
};

