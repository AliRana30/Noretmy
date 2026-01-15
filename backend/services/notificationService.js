const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification for a user
 */
const createNotification = async ({ userId, title, message, type, link = null, data = {} }) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      link,
      data,
      isGlobal: false
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create multiple notifications (bulk)
 */
const createBulkNotifications = async (notificationsArray) => {
  try {
    const notifications = await Notification.insertMany(notificationsArray);
    return notifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

/**
 * User Warning Notification
 */
const notifyUserWarned = async (userId, reason) => {
  return createNotification({
    userId,
    title: '⚠️ Warning Issued',
    message: `You have received a warning from the admin. Reason: ${reason}`,
    type: 'warning',
    data: { reason }
  });
};

/**
 * User Blocked Notification
 */
const notifyUserBlocked = async (userId, reason) => {
  return createNotification({
    userId,
    title: '🚫 Account Blocked',
    message: `Your account has been blocked. Reason: ${reason}. Please contact support for more information.`,
    type: 'alert',
    data: { reason }
  });
};

/**
 * User Unblocked Notification
 */
const notifyUserUnblocked = async (userId) => {
  return createNotification({
    userId,
    title: '✅ Account Unblocked',
    message: 'Your account has been unblocked. You can now access all features.',
    type: 'success',
    data: {}
  });
};

/**
 * Custom Order Request Notification (for seller)
 */
const notifyCustomOrderRequest = async (sellerId, buyerId, orderDetails) => {
  return createNotification({
    userId: sellerId,
    title: '📋 New Custom Order Request',
    message: `You have received a new custom order request. Please review and respond.`,
    type: 'order',
    link: '/orders',
    data: { buyerId, orderDetails }
  });
};

/**
 * Order Accepted Notification (for buyer)
 */
const notifyOrderAccepted = async (buyerId, orderId, orderTitle) => {
  return createNotification({
    userId: buyerId,
    title: '✅ Order Accepted',
    message: `Your order "${orderTitle}" has been accepted by the freelancer.`,
    type: 'order',
    link: `/orders/${orderId}`,
    data: { orderId, orderTitle }
  });
};

/**
 * Order Rejected Notification (for buyer)
 */
const notifyOrderRejected = async (buyerId, orderId, orderTitle, reason) => {
  return createNotification({
    userId: buyerId,
    title: '❌ Order Rejected',
    message: `Your order "${orderTitle}" has been rejected. Reason: ${reason}`,
    type: 'order',
    link: `/orders/${orderId}`,
    data: { orderId, orderTitle, reason }
  });
};

/**
 * Order Status Changed Notification - Generic for any status change
 */
const notifyOrderStatusChanged = async (userId, orderId, orderTitle, oldStatus, newStatus) => {
  const statusLabels = {
    created: 'Created',
    requirementsSubmitted: 'Requirements Submitted',
    started: 'In Progress',
    delivered: 'Delivered',
    requestedRevision: 'Revision Requested',
    completed: 'Completed',
    waitingReview: 'Awaiting Review',
    accepted: 'Accepted',
    cancelled: 'Cancelled'
  };

  const newStatusLabel = statusLabels[newStatus] || newStatus;
  
  return createNotification({
    userId,
    title: `📦 Order Status: ${newStatusLabel}`,
    message: `Your order "${orderTitle}" status has been updated to ${newStatusLabel}.`,
    type: 'order',
    link: `/orders/${orderId}`,
    data: { orderId, orderTitle, oldStatus, newStatus }
  });
};

/**
 * Order Started Notification (for buyer)
 */
const notifyOrderStarted = async (buyerId, orderId, orderTitle) => {
  return createNotification({
    userId: buyerId,
    title: '🚀 Order Started',
    message: `The freelancer has started working on your order "${orderTitle}".`,
    type: 'order',
    link: `/orders/${orderId}`,
    data: { orderId, orderTitle }
  });
};

/**
 * Order Delivered Notification (for buyer)
 */
const notifyOrderDelivered = async (buyerId, orderId, orderTitle) => {
  return createNotification({
    userId: buyerId,
    title: '📦 Order Delivered',
    message: `The freelancer has submitted delivery for your order "${orderTitle}". Please review and accept.`,
    type: 'order',
    link: `/orders/${orderId}`,
    data: { orderId, orderTitle }
  });
};

/**
 * Revision Requested Notification (for seller)
 */
const notifyRevisionRequested = async (sellerId, orderId, orderTitle, reason) => {
  return createNotification({
    userId: sellerId,
    title: '🔄 Revision Requested',
    message: `The buyer has requested a revision for order "${orderTitle}". Reason: ${reason || 'No reason provided'}`,
    type: 'order',
    link: `/orders/${orderId}`,
    data: { orderId, orderTitle, reason }
  });
};

/**
 * Requirements Submitted Notification (for seller)
 */
const notifyRequirementsSubmitted = async (sellerId, orderId, orderTitle) => {
  return createNotification({
    userId: sellerId,
    title: '📝 Requirements Submitted',
    message: `The buyer has submitted requirements for order "${orderTitle}". You can now start working.`,
    type: 'order',
    link: `/orders/${orderId}`,
    data: { orderId, orderTitle }
  });
};

/**
 * Timeline Extended Notification (for both buyer and seller)
 */
const notifyTimelineExtended = async (buyerId, sellerId, orderId, extensionDays, newDeadline) => {
  const notifications = [
    {
      userId: buyerId,
      title: '⏱️ Timeline Extended',
      message: `You have extended the timeline by ${extensionDays} day(s). New deadline: ${new Date(newDeadline).toLocaleDateString()}`,
      type: 'order',
      link: `/orders/${orderId}`,
      data: { orderId, extensionDays, newDeadline }
    },
    {
      userId: sellerId,
      title: '⏱️ Timeline Extended',
      message: `The client has extended the timeline by ${extensionDays} day(s). New deadline: ${new Date(newDeadline).toLocaleDateString()}`,
      type: 'order',
      link: `/orders/${orderId}`,
      data: { orderId, extensionDays, newDeadline }
    }
  ];
  
  return createBulkNotifications(notifications);
};

/**
 * Payment Completed Notification (for freelancer and admin)
 */
const notifyPaymentCompleted = async (freelancerId, adminId, orderId, amount) => {
  const notifications = [
    {
      userId: freelancerId,
      title: '💰 Payment Received',
      message: `You have received a payment of $${amount} for your completed order.`,
      type: 'payment',
      link: `/orders/${orderId}`,
      data: { orderId, amount }
    }
  ];
  
  if (adminId) {
    notifications.push({
      userId: adminId,
      title: '💳 Order Payment Completed',
      message: `An order payment of $${amount} has been completed.`,
      type: 'payment',
      data: { orderId, amount, freelancerId }
    });
  }
  
  return createBulkNotifications(notifications);
};

/**
 * Withdrawal Request Submitted (for admin)
 */
const notifyWithdrawalRequestSubmitted = async (adminIds, freelancerId, amount, requestId) => {
  const notifications = adminIds.map(adminId => ({
    userId: adminId,
    title: '💸 New Withdrawal Request',
    message: `A freelancer has requested to withdraw $${amount}. Please review.`,
    type: 'withdrawal',
    data: { freelancerId, amount, requestId },
    link: `/admin/withdrawals`
  }));
  
  const createdNotifications = await createBulkNotifications(notifications);
  
  const io = global.io;
  if (io) {
    adminIds.forEach((adminId) => {
      io.to(`user_${adminId}`).emit('notification', {
        title: '💸 New Withdrawal Request',
        message: `A freelancer has requested to withdraw $${amount}. Please review.`,
        type: 'withdrawal',
        link: `/admin/withdrawals`
      });
    });
  }
  
  return createdNotifications;
};

/**
 * Withdrawal Request Approved (for freelancer)
 */
const notifyWithdrawalApproved = async (freelancerId, amount, requestId) => {
  const notification = await createNotification({
    userId: freelancerId,
    title: '✅ Withdrawal Approved',
    message: `Your withdrawal request of $${amount} has been approved and will be processed shortly.`,
    type: 'withdrawal',
    data: { amount, requestId }
  });

  const io = global.io;
  if (io && freelancerId) {
    io.to(`user_${freelancerId}`).emit('notification', {
      title: '✅ Withdrawal Approved',
      message: `Your withdrawal request of $${amount} has been approved.`,
      type: 'withdrawal'
    });
  }

  return notification;
};

/**
 * Withdrawal Request Rejected (for freelancer)
 */
const notifyWithdrawalRejected = async (freelancerId, amount, requestId, reason) => {
  const notification = await createNotification({
    userId: freelancerId,
    title: '❌ Withdrawal Rejected',
    message: `Your withdrawal request of $${amount} has been rejected. Reason: ${reason}`,
    type: 'withdrawal',
    data: { amount, requestId, reason }
  });

  const io = global.io;
  if (io && freelancerId) {
    io.to(`user_${freelancerId}`).emit('notification', {
      title: '❌ Withdrawal Rejected',
      message: `Your withdrawal request of $${amount} was rejected.`,
      type: 'withdrawal'
    });
  }

  return notification;
};

/**
 * Order Completed (for both parties)
 */
const notifyOrderCompleted = async (buyerId, sellerId, orderId, orderTitle) => {
  const notifications = [
    {
      userId: buyerId,
      title: '🎉 Order Completed',
      message: `Your order "${orderTitle}" has been marked as completed.`,
      type: 'order',
      link: `/orders/${orderId}`,
      data: { orderId, orderTitle }
    },
    {
      userId: sellerId,
      title: '🎉 Order Completed',
      message: `Your order "${orderTitle}" has been completed. Funds will be available for withdrawal.`,
      type: 'order',
      link: `/orders/${orderId}`,
      data: { orderId, orderTitle }
    }
  ];
  
  return createBulkNotifications(notifications);
};

/**
 * New Message Notification
 */
const notifyNewMessage = async (userId, senderId, senderName, conversationId) => {
  return createNotification({
    userId,
    title: '💬 New Message',
    message: `You have a new message from ${senderName}.`,
    type: 'message',
    link: `/chat`,
    data: { senderId, senderName, conversationId }
  });
};

/**
 * Get all admin user IDs
 */
const getAdminIds = async () => {
  try {
    const admins = await User.find({ role: { $regex: /^admin$/i } }).select('_id');
    return admins.map(admin => admin._id);
  } catch (error) {
    console.error('Error fetching admin IDs:', error);
    return [];
  }
};

/**
 * Notify admins about order acceptance
 */
const notifyAdminOrderAccepted = async (orderId, orderTitle, sellerId, sellerName, amount) => {
  const adminIds = await getAdminIds();
  if (adminIds.length === 0) return [];

  const notifications = adminIds.map(adminId => ({
    userId: adminId,
    title: '✅ Order Accepted',
    message: `${sellerName} accepted order "${orderTitle}" ($${amount})`,
    type: 'order',
    data: { orderId, sellerId, amount },
    link: `/admin/orders/${orderId}`
  }));

  const created = await createBulkNotifications(notifications);

  const io = global.io;
  if (io) {
    adminIds.forEach((adminId) => {
      io.to(`user_${adminId}`).emit('notification', {
        title: '✅ Order Accepted',
        message: `${sellerName} accepted order "${orderTitle}" ($${amount})`,
        type: 'order',
        link: `/admin/orders/${orderId}`
      });
    });
  }

  return created;
};

/**
 * Notify admins about order rejection
 */
const notifyAdminOrderRejected = async (orderId, orderTitle, sellerId, sellerName, reason) => {
  const adminIds = await getAdminIds();
  if (adminIds.length === 0) return [];

  const notifications = adminIds.map(adminId => ({
    userId: adminId,
    title: '❌ Order Rejected',
    message: `${sellerName} rejected order "${orderTitle}". Reason: ${reason}`,
    type: 'order',
    data: { orderId, sellerId, reason },
    link: `/admin/orders/${orderId}`
  }));

  const created = await createBulkNotifications(notifications);

  const io = global.io;
  if (io) {
    adminIds.forEach((adminId) => {
      io.to(`user_${adminId}`).emit('notification', {
        title: '❌ Order Rejected',
        message: `${sellerName} rejected order "${orderTitle}"`,
        type: 'order',
        link: `/admin/orders/${orderId}`
      });
    });
  }

  return created;
};

/**
 * Notify admins about new payment
 */
const notifyAdminPaymentReceived = async (orderId, orderTitle, buyerName, amount) => {
  const adminIds = await getAdminIds();
  if (adminIds.length === 0) return [];

  const notifications = adminIds.map(adminId => ({
    userId: adminId,
    title: '💰 Payment Received',
    message: `${buyerName} paid $${amount} for "${orderTitle}"`,
    type: 'payment',
    data: { orderId, amount },
    link: `/admin/orders/${orderId}`
  }));

  const created = await createBulkNotifications(notifications);

  const io = global.io;
  if (io) {
    adminIds.forEach((adminId) => {
      io.to(`user_${adminId}`).emit('notification', {
        title: '💰 Payment Received',
        message: `${buyerName} paid $${amount} for "${orderTitle}"`,
        type: 'payment',
        link: `/admin/orders/${orderId}`
      });
    });
  }

  return created;
};

/**
 * Notify admins about promotion purchase
 */
const notifyAdminPromotionPurchased = async (userId, userName, promotionName, amount) => {
  const adminIds = await getAdminIds();
  if (adminIds.length === 0) return [];

  const notifications = adminIds.map(adminId => ({
    userId: adminId,
    title: '🎯 Promotion Purchased',
    message: `${userName} purchased "${promotionName}" promotion ($${amount})`,
    type: 'promotion',
    data: { userId, promotionName, amount },
    link: '/admin/promotions'
  }));

  const created = await createBulkNotifications(notifications);

  const io = global.io;
  if (io) {
    adminIds.forEach((adminId) => {
      io.to(`user_${adminId}`).emit('notification', {
        title: '🎯 Promotion Purchased',
        message: `${userName} purchased "${promotionName}" promotion ($${amount})`,
        type: 'promotion',
        link: '/admin/promotions'
      });
    });
  }

  return created;
};

module.exports = {
  createNotification,
  createBulkNotifications,
  notifyUserWarned,
  notifyUserBlocked,
  notifyUserUnblocked,
  notifyCustomOrderRequest,
  notifyOrderAccepted,
  notifyOrderRejected,
  notifyOrderStatusChanged,
  notifyOrderStarted,
  notifyOrderDelivered,
  notifyRevisionRequested,
  notifyRequirementsSubmitted,
  notifyTimelineExtended,
  notifyPaymentCompleted,
  notifyWithdrawalRequestSubmitted,
  notifyWithdrawalApproved,
  notifyWithdrawalRejected,
  notifyOrderCompleted,
  notifyNewMessage,
  getAdminIds,
  notifyAdminOrderAccepted,
  notifyAdminOrderRejected,
  notifyAdminPaymentReceived,
  notifyAdminPromotionPurchased
};
