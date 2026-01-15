const WithdrawalRequest = require('../models/WithdrawalRequest');
const User = require('../models/User');
const { 
  notifyWithdrawalRequestSubmitted,
  notifyWithdrawalApproved,
  notifyWithdrawalRejected,
  getAdminIds
} = require('../services/notificationService');

/**
 * Create a new withdrawal request
 */
const createWithdrawalRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { amount, paymentMethod, accountDetails, notes } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is $10'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const cooldownStatus = await WithdrawalRequest.isInCooldown(userId);
    if (cooldownStatus.inCooldown) {
      return res.status(400).json({
        success: false,
        message: `You are in a cooldown period. You can request a withdrawal after ${cooldownStatus.daysRemaining} day(s).`,
        cooldownEndsAt: cooldownStatus.cooldownEndsAt,
        daysRemaining: cooldownStatus.daysRemaining
      });
    }

    if (user.revenue.available < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: $${user.revenue.available}`
      });
    }

    const pendingRequest = await WithdrawalRequest.findOne({
      userId,
      status: 'pending'
    });

    if (pendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending withdrawal request'
      });
    }

    const withdrawalRequest = await WithdrawalRequest.create({
      userId,
      amount,
      paymentMethod,
accountDetails,
      notes
    });

    user.revenue.available -= amount;
    await user.save();

    const adminIds = await getAdminIds();
    if (adminIds.length > 0) {
      await notifyWithdrawalRequestSubmitted(
        adminIds,
        userId,
        amount,
        withdrawalRequest._id
      );
    }

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: withdrawalRequest
    });
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create withdrawal request',
      error: error.message
    });
  }
};

/**
 * Get user's withdrawal requests
 */
const getUserWithdrawalRequests = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10, status } = req.query;

    const filter = { userId };
    if (status) filter.status = status;

    const withdrawalRequests = await WithdrawalRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('processedBy', 'fullName email');

    const total = await WithdrawalRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: withdrawalRequests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal requests',
      error: error.message
    });
  }
};

/**
 * Get all withdrawal requests (Admin only)
 */
const getAllWithdrawalRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const withdrawalRequests = await WithdrawalRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'fullName email username')
      .populate('processedBy', 'fullName email');

    const total = await WithdrawalRequest.countDocuments(filter);

    const formattedRequests = withdrawalRequests.map(request => ({
      _id: request._id,
      id: request._id,
      user: request.userId?.fullName || 'Unknown',
      email: request.userId?.email || 'Unknown',
      amount: request.amount,
      paymentMethod: request.paymentMethod,
      status: request.status,
      requestedAt: request.requestedAt,
      processedAt: request.processedAt,
      processedBy: request.processedBy?.fullName || null,
      notes: request.notes,
      adminNotes: request.adminNotes,
      rejectionReason: request.rejectionReason
    }));

    res.status(200).json({
      success: true,
      data: formattedRequests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all withdrawal requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal requests',
      error: error.message
    });
  }
};

/**
 * Approve withdrawal request (Admin only)
 */
const approveWithdrawalRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { transactionId, adminNotes } = req.body;
    const adminId = req.userId;

    const withdrawalRequest = await WithdrawalRequest.findById(requestId);
    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawalRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve ${withdrawalRequest.status} request`
      });
    }

    withdrawalRequest.status = 'approved';
    withdrawalRequest.processedAt = new Date();
    withdrawalRequest.processedBy = adminId;
    withdrawalRequest.transactionId = transactionId;
    withdrawalRequest.adminNotes = adminNotes;
    await withdrawalRequest.save();

    const user = await User.findById(withdrawalRequest.userId);
    if (user) {
      user.revenue.withdrawn += withdrawalRequest.amount;
      await user.save();
    }

    await notifyWithdrawalApproved(
      withdrawalRequest.userId,
      withdrawalRequest.amount,
      withdrawalRequest._id
    );

    res.status(200).json({
      success: true,
      message: 'Withdrawal request approved successfully',
      data: withdrawalRequest
    });
  } catch (error) {
    console.error('Error approving withdrawal request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve withdrawal request',
      error: error.message
    });
  }
};

/**
 * Reject withdrawal request (Admin only)
 */
const rejectWithdrawalRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason, adminNotes } = req.body;
    const adminId = req.userId;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const withdrawalRequest = await WithdrawalRequest.findById(requestId);
    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawalRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject ${withdrawalRequest.status} request`
      });
    }

    withdrawalRequest.status = 'rejected';
    withdrawalRequest.processedAt = new Date();
    withdrawalRequest.processedBy = adminId;
    withdrawalRequest.rejectionReason = rejectionReason;
    withdrawalRequest.adminNotes = adminNotes;
    await withdrawalRequest.save();

    const user = await User.findById(withdrawalRequest.userId);
    if (user) {
      user.revenue.available += withdrawalRequest.amount;
      await user.save();
    }

    await notifyWithdrawalRejected(
      withdrawalRequest.userId,
      withdrawalRequest.amount,
      withdrawalRequest._id,
      rejectionReason
    );

    res.status(200).json({
      success: true,
      message: 'Withdrawal request rejected',
      data: withdrawalRequest
    });
  } catch (error) {
    console.error('Error rejecting withdrawal request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject withdrawal request',
      error: error.message
    });
  }
};

/**
 * Cancel withdrawal request (User can cancel their own pending request)
 */
const cancelWithdrawalRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.userId;

    const withdrawalRequest = await WithdrawalRequest.findById(requestId);
    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawalRequest.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own withdrawal requests'
      });
    }

    if (withdrawalRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${withdrawalRequest.status} request`
      });
    }

    await WithdrawalRequest.findByIdAndDelete(requestId);

    const user = await User.findById(userId);
    if (user) {
      user.revenue.available += withdrawalRequest.amount;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Withdrawal request cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling withdrawal request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel withdrawal request',
      error: error.message
    });
  }
};

/**
 * Check user's cooldown status
 */
const getCooldownStatus = async (req, res) => {
  try {
    const userId = req.userId;
    
    const cooldownStatus = await WithdrawalRequest.isInCooldown(userId);
    const cooldownDays = WithdrawalRequest.getCooldownDays();
    
    const user = await User.findById(userId).select('revenue');
    
    res.status(200).json({
      success: true,
      data: {
        cooldownDays,
        ...cooldownStatus,
        revenue: user?.revenue || { total: 0, available: 0, pending: 0, withdrawn: 0 }
      }
    });
  } catch (error) {
    console.error('Error checking cooldown status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check cooldown status',
      error: error.message
    });
  }
};

/**
 * Get withdrawal statistics for a user
 */
const getWithdrawalStats = async (req, res) => {
  try {
    const userId = req.userId;
    
    const [totalWithdrawals, pendingWithdrawals, approvedWithdrawals] = await Promise.all([
      WithdrawalRequest.countDocuments({ userId }),
      WithdrawalRequest.countDocuments({ userId, status: 'pending' }),
      WithdrawalRequest.countDocuments({ userId, status: { $in: ['approved', 'paid'] } })
    ]);
    
    const totalWithdrawn = await WithdrawalRequest.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId(userId), status: { $in: ['approved', 'paid'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const user = await User.findById(userId).select('revenue');
    
    res.status(200).json({
      success: true,
      data: {
        totalWithdrawals,
        pendingWithdrawals,
        approvedWithdrawals,
        totalWithdrawn: totalWithdrawn[0]?.total || 0,
        revenue: user?.revenue || { total: 0, available: 0, pending: 0, withdrawn: 0 }
      }
    });
  } catch (error) {
    console.error('Error getting withdrawal stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal statistics',
      error: error.message
    });
  }
};

module.exports = {
  createWithdrawalRequest,
  getUserWithdrawalRequests,
  getAllWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  cancelWithdrawalRequest,
  getCooldownStatus,
  getWithdrawalStats
};
