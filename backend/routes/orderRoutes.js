// routes/orderRoutes.js
const express = require('express');
const multer = require('multer');
const { storage } = require('../config/cloudinaryConfig');
const {  
  createOrder,
  completeOrderAfterPayment,
  getOrders,
  getPaymentsSummary,
  getUserOrders,
  getSingleOrderDetail, 
  createOrderPaypal,
  captureOrder,
  confirmMilestoneOrCustomOrder,
  getCustomerOrderRequests,
  addOrderRequirement,
  startOrder,
  deliverOrder,
  requestRevision,
  acceptOrder,
  updateMilestoneStatus,
  updateOrders,
  createOrderInvitation,
  getSellerInvitations,
  acceptInvitation,
  rejectInvitation,
  getBuyerInvitations,
  updateOrderProgress,
  completeOrderWithPayment,
  submitReview,
  getOrderTimeline,
  getActiveOrders,
  approveDelivery,
  approveProgress,
  requestTimelineExtension,
  advanceOrderStatus,
  cancelOrder
} = require('../controllers/orderControllers');
const { verifyToken, checkRole } = require('../middleware/jwt');
const { upload } = require('../utils/uploadFiles');

const router = express.Router();

/* ----------------- Order Routes ----------------- */
// Create a new order
router.post('/', verifyToken, createOrder);
router.post('/complete-payment', verifyToken, completeOrderAfterPayment); // LMS-style payment verification
router.post('/confirm', verifyToken, confirmMilestoneOrCustomOrder);
router.post('/milestone', verifyToken, updateMilestoneStatus);

// Order Invitation Routes - Allow both 'buyer' role (for backward compat) and any client
router.post('/invitation', verifyToken, createOrderInvitation);
router.get('/invitations/seller', verifyToken, getSellerInvitations);
router.get('/invitations/buyer', verifyToken, getBuyerInvitations);
router.post('/invitation/accept', verifyToken, acceptInvitation);
router.post('/invitation/reject', verifyToken, rejectInvitation);

router.post('/create-order/paypal', createOrderPaypal);
router.post('/capture-order', captureOrder);

// Order Operations
router.put("/start", verifyToken, startOrder);
router.put("/requirements-submit", verifyToken, upload, addOrderRequirement);
router.put("/deliver", verifyToken, upload, deliverOrder);
router.put("/revision-request", verifyToken, upload, requestRevision);
router.put("/accept", verifyToken, acceptOrder);

// Progress and Timeline
router.put("/progress", verifyToken, updateOrderProgress);
router.get("/:id/timeline", verifyToken, getOrderTimeline);
router.post("/timeline/extend", verifyToken, requestTimelineExtension);

// Buyer approval actions
router.put("/approve-delivery", verifyToken, approveDelivery);
router.put("/approve-progress", verifyToken, approveProgress);
router.post("/advance-status", verifyToken, advanceOrderStatus);
router.put("/cancel", verifyToken, cancelOrder);

// Payment after completion (milestone/after-delivery payment)
router.post("/complete-payment-milestone", verifyToken, completeOrderWithPayment);

// Review submission
router.post("/review", verifyToken, submitReview);

// Get active orders for timeline display
router.get('/active', verifyToken, getActiveOrders);

// Milestone order status changes
router.put('/milestone', verifyToken, upload, updateMilestoneStatus);

// Get orders specific to a logged-in user (must be before '/')
router.get('/userOrders', verifyToken, getUserOrders);

// Get custom order request
router.get('/requests', verifyToken, getCustomerOrderRequests);

// Get details of a single order by ID
router.get('/single/:id', verifyToken, getSingleOrderDetail);

/* ---------------- Payments Summary ---------------- */
// Get payments summary for orders (protected - admin only)
router.get('/payments/summary', verifyToken, getPaymentsSummary);

// Get all orders (admin or system-level access) - must be after specific routes
router.get('/', verifyToken, getOrders);

router.put("/update-orders", verifyToken, updateOrders);

module.exports = router;
