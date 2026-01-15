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

router.post('/', verifyToken, createOrder);
router.post('/complete-payment', verifyToken, completeOrderAfterPayment); // LMS-style payment verification
router.post('/confirm', verifyToken, confirmMilestoneOrCustomOrder);
router.post('/milestone', verifyToken, updateMilestoneStatus);

router.post('/invitation', verifyToken, createOrderInvitation);
router.get('/invitations/seller', verifyToken, getSellerInvitations);
router.get('/invitations/buyer', verifyToken, getBuyerInvitations);
router.post('/invitation/accept', verifyToken, acceptInvitation);
router.post('/invitation/reject', verifyToken, rejectInvitation);

router.post('/create-order/paypal', createOrderPaypal);
router.post('/capture-order', captureOrder);

router.put("/start", verifyToken, startOrder);
router.put("/requirements-submit", verifyToken, upload, addOrderRequirement);
router.put("/deliver", verifyToken, upload, deliverOrder);
router.put("/revision-request", verifyToken, upload, requestRevision);
router.put("/accept", verifyToken, acceptOrder);

router.put("/progress", verifyToken, updateOrderProgress);
router.get("/:id/timeline", verifyToken, getOrderTimeline);
router.post("/timeline/extend", verifyToken, requestTimelineExtension);

router.put("/approve-delivery", verifyToken, approveDelivery);
router.put("/approve-progress", verifyToken, approveProgress);
router.post("/advance-status", verifyToken, advanceOrderStatus);
router.put("/cancel", verifyToken, cancelOrder);

router.post("/complete-payment-milestone", verifyToken, completeOrderWithPayment);

router.post("/review", verifyToken, submitReview);

router.get('/active', verifyToken, getActiveOrders);

router.put('/milestone', verifyToken, upload, updateMilestoneStatus);

router.get('/userOrders', verifyToken, getUserOrders);

router.get('/requests', verifyToken, getCustomerOrderRequests);

router.get('/single/:id', verifyToken, getSingleOrderDetail);

router.get('/payments/summary', verifyToken, getPaymentsSummary);

router.get('/', verifyToken, getOrders);

router.put("/update-orders", verifyToken, updateOrders);

module.exports = router;
