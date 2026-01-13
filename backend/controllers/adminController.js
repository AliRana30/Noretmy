const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Job = require('../models/Job');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const Newsletter = require('../models/Newsletter');
const Contact = require('../models/Contact');
const Project = require('../models/Project');
const Promotion = require('../models/Promotion'); // Legacy
const PromotionPurchase = require('../models/PromotionPurchase'); // New: Single source of truth
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Vat = require('../models/Vat');
const { createAdminUser, updateUserRole: updateUserRoleService } = require('../services/authService');
const mongoose = require('mongoose');
const { 
  notifyWithdrawalApproved,
  notifyWithdrawalRejected
} = require('../services/notificationService');

const formatWithdrawalRequestForAdmin = (request) => ({
  _id: request._id,
  requestId: request._id,
  userId: request.userId?._id,
  username: request.userId?.username,
  userEmail: request.userId?.email,
  userFullName: request.userId?.fullName,
  amount: request.amount,
  withdrawalMethod: request.paymentMethod,
  paymentMethod: request.paymentMethod,
  accountDetails: request.accountDetails,
  notes: request.notes,
  status: request.status,
  adminNote: request.adminNotes,
  adminNotes: request.adminNotes,
  rejectionReason: request.rejectionReason,
  processedBy: request.processedBy,
  processedAt: request.processedAt,
  requestedAt: request.requestedAt,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt
});

// ==================== DASHBOARD & ANALYTICS ====================

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalClients, 
      totalFreelancers,
      verifiedUsers,
      blockedUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      totalJobs,
      activeJobs,
      totalOrders,
      completedOrders,
      pendingOrders,
      totalRevenueFromPromotions,
      monthlyRevenueFromPromotions,
      totalCommissionsFromOrders,
      totalReviews,
      averageRating,
      totalMessages,
      totalConversations,
      pendingWithdrawals,
      totalPromotions,
      activePromotions,
      unreadContacts,
      newsletterSubscribers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ role: 'freelancer' }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isBlocked: true }),
      User.countDocuments({ 
        createdAt: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
        } 
      }),
      User.countDocuments({ 
        createdAt: { 
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        } 
      }),
      User.countDocuments({ 
        createdAt: { 
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
        } 
      }),
      Job.countDocuments(),
      Job.countDocuments({ jobStatus: { $in: ['Available', 'active', 'Active'] } }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'completed' }),
      Order.countDocuments({ status: { $in: ['pending', 'in_progress', 'started'] } }),
      // Admin revenue from promotion plan purchases
      PromotionPurchase.aggregate([
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => result[0]?.total || 0),
      PromotionPurchase.aggregate([
        { 
          $match: { 
            createdAt: { 
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
            } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => result[0]?.total || 0),
      // Platform commissions from completed orders
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$platformFee' } } }
      ]).then(result => result[0]?.total || 0),
      Review.countDocuments(),
      Review.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$star' } } }
      ]).then(result => result[0]?.avgRating || 0),
      Message.countDocuments(),
      Conversation.countDocuments(),
      WithdrawalRequest.countDocuments({ status: 'pending' }),
      PromotionPurchase.countDocuments(),
      PromotionPurchase.countDocuments({ status: 'active' }),
      Contact.countDocuments({ isRead: false }),
      Newsletter.countDocuments()
    ]);

    const finalTotalRevenue = totalRevenueFromPromotions + totalCommissionsFromOrders;

    // Growth statistics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Top performing categories
    const topJobCategories = await Job.aggregate([
      { $group: { _id: '$cat', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Recent activity
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('buyerId', 'fullName email')
      .populate('sellerId', 'fullName email');

    // Get revenue metrics
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      dailyRevenueRes,
      weeklyRevenueRes,
      monthlyRevenueRes,
      overallRevenueRes
    ] = await Promise.all([
      Order.aggregate([
        { $match: { status: 'completed', orderCompletionDate: { $gte: today } } },
        { 
          $group: { 
            _id: null, 
            total: { 
              $sum: { 
                $cond: [
                  { $gt: ['$platformFee', null] }, 
                  '$platformFee', 
                  { $subtract: [{ $ifNull: ['$feeAndTax', 0] }, { $ifNull: ['$vatAmount', 0] }] }
                ] 
              } 
            } 
          } 
        }
      ]),
      Order.aggregate([
        { $match: { status: 'completed', orderCompletionDate: { $gte: startOfWeek } } },
        { 
          $group: { 
            _id: null, 
            total: { 
              $sum: { 
                $cond: [
                  { $gt: ['$platformFee', null] }, 
                  '$platformFee', 
                  { $subtract: [{ $ifNull: ['$feeAndTax', 0] }, { $ifNull: ['$vatAmount', 0] }] }
                ] 
              } 
            } 
          } 
        }
      ]),
      Order.aggregate([
        { $match: { status: 'completed', orderCompletionDate: { $gte: startOfMonth } } },
        { 
          $group: { 
            _id: null, 
            total: { 
              $sum: { 
                $cond: [
                  { $gt: ['$platformFee', null] }, 
                  '$platformFee', 
                  { $subtract: [{ $ifNull: ['$feeAndTax', 0] }, { $ifNull: ['$vatAmount', 0] }] }
                ] 
              } 
            } 
          } 
        }
      ]),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { 
          $group: { 
            _id: null, 
            total: { 
              $sum: { 
                $cond: [
                  { $gt: ['$platformFee', null] }, 
                  '$platformFee', 
                  { $subtract: [{ $ifNull: ['$feeAndTax', 0] }, { $ifNull: ['$vatAmount', 0] }] }
                ] 
              } 
            } 
          } 
        }
      ])
    ]);

    const dailyRevenue = dailyRevenueRes[0]?.total || 0;
    const weeklyRevenue = weeklyRevenueRes[0]?.total || 0;
    const monthlyRevenue = monthlyRevenueRes[0]?.total || 0;
    const totalRevenueFromOrders = overallRevenueRes[0]?.total || 0;

    // Monthly revenue for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRevenueInsight = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { 
            $sum: { 
              $cond: [
                { $gt: ['$platformFee', null] }, 
                '$platformFee', 
                { $subtract: [{ $ifNull: ['$feeAndTax', 0] }, { $ifNull: ['$vatAmount', 0] }] }
              ] 
            } 
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format monthly data for chart
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const found = monthlyRevenueInsight.find(m => m._id.year === year && m._id.month === month);
      chartData.push({
        month: d.toISOString(), // Send ISO string or name
        revenue: found?.revenue || 0
      });
    }

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          admins: totalAdmins,
          clients: totalClients,
          freelancers: totalFreelancers,
          verified: verifiedUsers,
          blocked: blockedUsers,
          newToday: newUsersToday,
          newThisWeek: newUsersThisWeek,
          newThisMonth: newUsersThisMonth,
          newLast30Days: newUsersLast30Days
        },
        business: {
          totalJobs,
          activeJobs,
          totalOrders,
          completedOrders,
          pendingOrders,
          totalRevenue: totalRevenueFromOrders + totalRevenueFromPromotions,
          dailyRevenue: dailyRevenue,
          weeklyRevenue: weeklyRevenue,
          monthlyRevenue: monthlyRevenue,
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10
        },
        communication: {
          totalMessages,
          totalConversations,
          unreadContacts
        },
        financial: {
          pendingWithdrawals,
          totalPromotions,
          activePromotions
        },
        marketing: {
          newsletterSubscribers
        },
        insights: {
          topJobCategories,
          recentOrders,
          monthlyRevenue: chartData
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// ==================== USER MANAGEMENT ====================

const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      isVerified, 
      isBlocked, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      country,
      dateFrom,
      dateTo
    } = req.query;

    const filter = {};
    
    // Apply filters
    if (role && role !== 'all') filter.role = role;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (isBlocked !== undefined) filter.isBlocked = isBlocked === 'true';
    
    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    
    // Search functionality
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    // Fetch profile pictures from UserProfile for all users
    const userIds = users.map(u => u._id);
    const userProfiles = await UserProfile.find({ userId: { $in: userIds } }).lean();
    const profileMap = {};
    userProfiles.forEach(profile => {
      profileMap[profile.userId.toString()] = profile.profilePicture;
    });

    // Format data for frontend DataGrid (matching your existing structure)
    const formattedUsers = users.map((user) => ({
      _id: user._id,
      id: user._id, // For DataGrid compatibility
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      img: profileMap[user._id.toString()] || user.profilePicture || "https://via.placeholder.com/150", // Get from UserProfile first
      profilePicture: profileMap[user._id.toString()] || user.profilePicture || "https://via.placeholder.com/150",
      status: user.isBlocked ? "Blocked" : user.isWarned ? "Warned" : user.isVerified ? "Active" : "Pending",
      isSeller: user.isSeller,
      isVerified: user.isVerified,
      isBlocked: user.isBlocked,
      isWarned: user.isWarned,
      isCompany: user.isCompany,
      documentStatus: user.documentStatus,
      permissions: user.permissions || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: formattedUsers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      filters: {
        role,
        isVerified,
        isBlocked,
        search,
        sortBy,
        sortOrder,
        dateFrom,
        dateTo
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const mongoose = require('mongoose');
    
    // Validate userId format
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.'
      });
    }
    
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    let user;
    try {
      user = await User.findById(userId).select('-password');
    } catch (dbError) {
      console.error('Database error finding user:', dbError);
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch related data
    let userProfile = null;
    let userJobs = [];
    let userOrders = [];
    let userReviews = [];

    try {
      userProfile = await UserProfile.findOne({ userId: userObjectId });
    } catch (e) { }

    // Fetch ALL jobs for this user (for the table)
    try {
      userJobs = await Job.find({ sellerId: userId }).select('_id title category location isActive createdAt upgradeOption').lean();
    } catch (e) { }

    // Fetch recent orders
    try {
      userOrders = await Order.find({ 
        $or: [{ buyerId: userId }, { sellerId: userId }] 
      }).sort({ createdAt: -1 }).limit(20).lean();
    } catch (e) { }

    // Fetch recent reviews
    try {
      userReviews = await Review.find({
        $or: [{ userId: userId }, { sellerId: userId }]
      }).sort({ createdAt: -1 }).limit(10).lean();
    } catch (e) { }

    // Calculate stats
    let userStats = {
      totalJobs: 0, totalOrders: 0, completedOrders: 0, averageRating: 0,
      totalEarnings: 0, totalEarned: 0, totalSpent: 0, totalOrdersPlaced: 0, totalReviews: 0
    };

    try { userStats.totalJobs = userJobs.length; } catch (e) {}
    
    try {
      userStats.totalOrders = await Order.countDocuments({
        $or: [{ buyerId: userId }, { sellerId: userId }]
      });
    } catch (e) {}

    try {
      userStats.completedOrders = await Order.countDocuments({
        $or: [{ buyerId: userId }, { sellerId: userId }],
        status: 'completed'
      });
    } catch (e) {}

    try {
      const ratingResult = await Review.aggregate([
        { $match: { sellerId: userId } },
        { $group: { _id: null, avgRating: { $avg: '$star' }, count: { $sum: 1 } } }
      ]);
      userStats.averageRating = ratingResult[0]?.avgRating || 0;
      userStats.totalReviews = ratingResult[0]?.count || 0;
    } catch (e) {}

    try {
      const earningsResult = await Order.aggregate([
        { $match: { sellerId: userId, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ]);
      userStats.totalEarned = earningsResult[0]?.total || 0;
      userStats.totalEarnings = userStats.totalEarned;
    } catch (e) {}

    try {
      const spendingResult = await Order.aggregate([
        { $match: { buyerId: userId, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      userStats.totalSpent = spendingResult[0]?.total || 0;
    } catch (e) {}

    try {
      userStats.totalOrdersPlaced = await Order.countDocuments({ buyerId: userId });
    } catch (e) {}

    // Generate 6-month chart data
    let chartData = [];
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const isFreelancer = user.role === 'seller' || user.role === 'freelancer';
      const matchField = isFreelancer ? 'sellerId' : 'buyerId';
      const sumField = isFreelancer ? '$price' : '$totalAmount';

      const monthlyData = await Order.aggregate([
        { 
          $match: { 
            [matchField]: userId, 
            status: 'completed',
            createdAt: { $gte: sixMonthsAgo }
          } 
        },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            total: { $sum: sumField }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const found = monthlyData.find(m => m._id.year === year && m._id.month === month);
        chartData.push({ name: monthNames[month - 1], Total: found?.total || 0 });
      }
    } catch (e) { }

    // Map recent activity for the frontend table
    const formattedJobs = userJobs.map(job => ({
      id: job._id,
      img: userProfile?.profilePicture || user.profilePicture || "https://via.placeholder.com/150",
      location: job.location || "N/A",
      jobStatus: job.jobStatus || (job.isActive ? 'Active' : 'Inactive'),
      date: new Date(job.createdAt).toLocaleDateString(),
      upgradeOption: job.upgradeOption || "None",
      method: "GIG",
      status: job.jobStatus === 'Available' || job.jobStatus === 'active' || job.jobStatus === 'Active' ? 'Approved' : 'Pending'
    }));

    const formattedOrders = userOrders.map(order => ({
      id: order._id,
      img: userProfile?.profilePicture || user.profilePicture || "https://via.placeholder.com/150",
      location: "Order",
      jobStatus: order.status,
      date: new Date(order.createdAt).toLocaleDateString(),
      upgradeOption: `$${order.totalAmount || order.price}`,
      method: "ORDER",
      status: order.status === 'completed' ? 'Approved' : 'Pending'
    }));

    res.status(200).json({
      success: true,
      data: {
        user: { 
          ...user.toObject(), 
          img: userProfile?.profilePicture || user.profilePicture || "https://via.placeholder.com/150",
          profilePicture: userProfile?.profilePicture || user.profilePicture || "https://via.placeholder.com/150"
        },
        profile: userProfile,
        stats: userStats,
        chartData: chartData,
        recentActivity: {
          jobs: formattedJobs,
          orders: formattedOrders,
          reviews: userReviews
        }
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user details', error: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, permissions = [] } = req.body;

    if (!['admin', 'client', 'freelancer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    const result = await updateUserRoleService(userId, role, permissions);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot block admin users'
      });
    }

    user.isBlocked = true;
    user.blockReason = reason;
    user.blockedAt = new Date();
    
    if (duration > 0) {
      user.blockExpiresAt = new Date(Date.now() + (duration * 24 * 60 * 60 * 1000));
    }

    await user.save();

    // Send email notification to user about block
    try {
      const { sendUserNotificationEmail } = require('../services/emailService');
      if (user.email) {
        const normalizedRole = (user.role || '').toLowerCase();
        const notificationUserType = (normalizedRole === 'freelancer' || user.isSeller === true) ? 'seller' : 'client';
        await sendUserNotificationEmail(
          user.email,
          'block',
          reason,
          notificationUserType,
          {
            reason: reason,
            blockedAt: user.blockedAt,
            expiresAt: user.blockExpiresAt,
            duration: duration
          }
        );
        console.log('✅ Block notification email sent to user:', user.email);
      }
    } catch (emailError) {
      console.error('Error sending block notification email:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'User blocked successfully',
      data: {
        userId,
        isBlocked: true,
        reason,
        blockedAt: user.blockedAt,
        expiresAt: user.blockExpiresAt
      }
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block user',
      error: error.message
    });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isBlocked = false;
    user.blockReason = undefined;
    user.blockedAt = undefined;
    user.blockExpiresAt = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully',
      data: {
        userId,
        isBlocked: false
      }
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock user',
      error: error.message
    });
  }
};

const verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // Set user as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    user.verifiedAt = new Date();

    await user.save();

    // Send email notification to user about verification approval
    try {
      const { sendUserNotificationEmail } = require('../services/emailService');
      if (user.email) {
        const normalizedRole = (user.role || '').toLowerCase();
        const notificationUserType = (normalizedRole === 'freelancer' || user.isSeller === true) ? 'seller' : 'client';
        await sendUserNotificationEmail(
          user.email,
          'verified',
          'Your account has been verified and approved by our admin team.',
          notificationUserType,
          {
            userId: userId,
            verifiedAt: user.verifiedAt,
            fullName: user.fullName || user.username
          }
        );
        console.log('✅ Verification approval email sent to user:', user.email);
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError.message);
    }

    res.status(200).json({
      success: true,
      code: 'USER_VERIFIED',
      message: 'User verified successfully',
      data: {
        userId,
        isVerified: true,
        verifiedAt: user.verifiedAt
      }
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({
      success: false,
      code: 'VERIFY_USER_ERROR',
      message: 'Failed to verify user',
      error: error.message
    });
  }
};

const warnUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot warn admin users'
      });
    }

    // Initialize warnings array if it doesn't exist
    if (!user.warnings) {
      user.warnings = [];
    }

    // Add warning
    const warning = {
      reason,
      warnedAt: new Date(),
      warnedBy: req.user._id
    };
    user.warnings.push(warning);
    user.warningCount = user.warnings.length;
    user.lastWarnedAt = new Date();

    await user.save();

    // Create notification for the user
    try {
      await Notification.create({
        userId: userId,
        type: 'warning',
        title: 'Account Warning',
        message: `Your account has received a warning: ${reason}`,
        read: false
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    // Send email notification to user
    try {
      const { sendUserNotificationEmail } = require('../services/emailService');
      if (user.email) {
        const normalizedRole = (user.role || '').toLowerCase();
        const notificationUserType = (normalizedRole === 'freelancer' || user.isSeller === true) ? 'seller' : 'client';
        await sendUserNotificationEmail(
          user.email,
          'warn',
          `Warning ${user.warningCount}: ${reason}`,
          notificationUserType,
          {
            warningCount: user.warningCount,
            reason: reason,
            warnedAt: warning.warnedAt,
            userId: userId
          }
        );
        console.log('✅ Warning email sent to user:', user.email);
      }
    } catch (emailError) {
      console.error('Error sending warning email:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'User warned successfully',
      data: {
        userId,
        warningCount: user.warningCount,
        reason,
        warnedAt: warning.warnedAt
      }
    });
  } catch (error) {
    console.error('Warn user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to warn user',
      error: error.message
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    // Delete related data
    await Promise.all([
      UserProfile.deleteMany({ userId }),
      // Optionally delete user's jobs, messages etc - be careful with this
      // Job.deleteMany({ userId }),
      // Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }),
    ]);

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {
        userId,
        reason: reason || 'Deleted by admin'
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// ==================== JOB/GIG MANAGEMENT ====================

const getAllJobs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      priceMin,
      priceMax,
      featured
    } = req.query;

    const filter = {};
    
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (featured !== undefined) filter.isFeatured = featured === 'true';
    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = parseInt(priceMin);
      if (priceMax) filter.price.$lte = parseInt(priceMax);
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const jobs = await Job.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'fullName email username');

    const total = await Job.countDocuments(filter);

    // Format data for frontend DataGrid
    const formattedJobs = jobs.map((job) => ({
      _id: job._id,
      id: job._id,
      title: job.title,
      sellerId: job.userId?.username || job.userId?._id,
      sellerName: job.userId?.fullName,
      sellerEmail: job.userId?.email,
      price: job.price,
      category: job.category,
      location: job.location,
      jobStatus: job.status || job.jobStatus,
      status: job.status || job.jobStatus,
      upgradeOption: job.upgradeOption,
      isFeatured: job.isFeatured,
      isActive: job.isActive,
      tags: job.tags,
      description: job.description,
      adminNote: job.adminNote,
      createdAt: job.createdAt,
      date: new Date(job.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }));

    res.status(200).json({
      success: true,
      data: formattedJobs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      filters: {
        category,
        status,
        search,
        sortBy,
        sortOrder,
        priceMin,
        priceMax,
        featured
      }
    });
  } catch (error) {
    console.error('Get all jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
};

const updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, reason } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    job.status = status;
    if (reason) job.adminNote = reason;
    job.updatedAt = new Date();

    await job.save();

    res.status(200).json({
      success: true,
      message: 'Job status updated successfully',
      data: job
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job status',
      error: error.message
    });
  }
};

const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { reason } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if job has active orders
    const activeOrders = await Order.countDocuments({
      jobId,
      status: { $nin: ['completed', 'cancelled'] }
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete job with ${activeOrders} active orders`
      });
    }

    await Job.findByIdAndDelete(jobId);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
      data: { jobId, reason }
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message
    });
  }
};

// ==================== ORDER MANAGEMENT ====================

const getAllOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom,
      dateTo,
      minAmount,
      maxAmount
    } = req.query;

    const filter = {};
    
    if (status) filter.status = status;
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (minAmount || maxAmount) {
      filter.totalPrice = {};
      if (minAmount) filter.totalPrice.$gte = parseInt(minAmount);
      if (maxAmount) filter.totalPrice.$lte = parseInt(maxAmount);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await Order.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('buyerId', 'fullName email username')
      .populate('sellerId', 'fullName email username')
      .populate('gigId', 'title category');

    const total = await Order.countDocuments(filter);

    // Format data for frontend DataGrid (matching your existing structure)
    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      id: order._id,
      gigId: order.gigId?._id || order.gigId,
      gigTitle: order.gigId?.title,
      gigCategory: order.gigId?.category,
      price: order.totalPrice || order.price,
      sellerId: order.sellerId?.username || order.sellerId?._id,
      sellerName: order.sellerId?.fullName,
      sellerEmail: order.sellerId?.email,
      buyerId: order.buyerId?.username || order.buyerId?._id,
      buyerName: order.buyerId?.fullName,
      buyerEmail: order.buyerId?.email,
      status: order.status,
      isCompleted: order.status === 'completed',
      adminNote: order.adminNote,
      paymentStatus: order.paymentStatus,
      deliveryTime: order.deliveryTime,
      requirements: order.requirements,
      deliverables: order.deliverables,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      date: new Date(order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }));

    res.status(200).json({
      success: true,
      data: formattedOrders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      filters: {
        status,
        search,
        sortBy,
        sortOrder,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Validate orderId format - must be 24 character hex string
    if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format. Order ID must be a 24 character hexadecimal string.'
      });
    }
    
    // First find the order
    let order;
    try {
      order = await Order.findById(orderId);
    } catch (dbError) {
      console.error('Database error finding order:', dbError);
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Convert to plain object for modifications
    order = order.toObject();
    
    // Manually fetch buyer and seller since they might be stored as strings
    // Wrap in try-catch to handle invalid ObjectId format for user IDs
    let buyer = null;
    let seller = null;
    let job = null;
    
    try {
      if (order.buyerId && (typeof order.buyerId === 'string' ? order.buyerId.match(/^[0-9a-fA-F]{24}$/) : true)) {
        buyer = await User.findById(order.buyerId).select('fullName email username profilePicture').lean();
        if (buyer) {
          const profile = await UserProfile.findOne({ userId: buyer._id }).select('profilePicture').lean();
          buyer.profilePicture = profile?.profilePicture || buyer.profilePicture;
        }
      }
    } catch (e) {}
    
    try {
      if (order.sellerId && (typeof order.sellerId === 'string' ? order.sellerId.match(/^[0-9a-fA-F]{24}$/) : true)) {
        seller = await User.findById(order.sellerId).select('fullName email username profilePicture').lean();
        if (seller) {
          const profile = await UserProfile.findOne({ userId: seller._id }).select('profilePicture').lean();
          seller.profilePicture = profile?.profilePicture || seller.profilePicture;
        }
      }
    } catch (e) {}
    
    try {
      const gigId = order.gigId || order.jobId;
      if (gigId) {
        job = await Job.findById(gigId).select('title description category price images').lean().catch(() => null);
      }
    } catch (e) {
      }
    
    // Attach populated data
    order.buyerId = buyer || { _id: order.buyerId, fullName: 'Unknown Buyer' };
    order.sellerId = seller || { _id: order.sellerId, fullName: 'Unknown Seller' };
    order.jobId = job || null;

    // Get related messages (may not exist)
    let messages = [];
    try {
      messages = await Message.find({
        orderId: orderId
      }).populate('senderId', 'fullName').sort({ createdAt: 1 });
    } catch (e) {
      }

    // Get reviews for this order (may not exist)
    let reviews = [];
    try {
      reviews = await Review.find({
        orderId: orderId
      }).populate('reviewerId revieweeId', 'fullName');
    } catch (e) {
      }

    res.status(200).json({
      success: true,
      data: {
        order,
        messages,
        reviews
      }
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, adminNote } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    if (adminNote) order.adminNote = adminNote;
    order.updatedAt = new Date();

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Prevent deletion of active orders (optional safety check)
    if (['in_progress', 'pending'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete active orders. Please cancel or complete the order first.'
      });
    }

    // Store order info for logging before deletion
    const orderInfo = {
      orderId: order._id,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      totalPrice: order.totalPrice,
      status: order.status,
      deletedBy: req.userId,
      deletionReason: reason || 'No reason provided'
    };

    // Delete the order
    await Order.findByIdAndDelete(orderId);

    // Log the deletion (optional - if you have audit logging)
    res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
      data: orderInfo
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
};

// ==================== FINANCIAL MANAGEMENT ====================

const getFinancialOverview = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '90d':
        dateFilter = { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) };
        break;
      case '1y':
        dateFilter = { $gte: new Date(now - 365 * 24 * 60 * 60 * 1000) };
        break;
    }

    const [
      allTimeOrderFees,
      periodOrderFees,
      allTimePromotionFees,
      periodPromotionFees,
      pendingPayments,
      completedOrders,
      pendingWithdrawals,
      totalWithdrawals,
      platformFees,
      refunds
    ] = await Promise.all([
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$platformFee', 0] } } } }
      ]).then(result => result[0]?.total || 0),

      Order.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: dateFilter
          }
        },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$platformFee', 0] } } } }
      ]).then(result => result[0]?.total || 0),

      PromotionPurchase.aggregate([
        { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', 0] } } } }
      ]).then(result => result[0]?.total || 0),

      PromotionPurchase.aggregate([
        {
          $match: {
            createdAt: dateFilter
          }
        },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', 0] } } } }
      ]).then(result => result[0]?.total || 0),

      Order.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', '$price'] } } } }
      ]).then(result => result[0]?.total || 0),

      Order.countDocuments({ status: 'completed', createdAt: dateFilter }),

      WithdrawalRequest.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(result => result[0]?.total || 0),

      WithdrawalRequest.aggregate([
        { $match: { status: { $in: ['approved', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(result => result[0]?.total || 0),

      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$platformFee', 0] } } } }
      ]).then(result => result[0]?.total || 0),

      Order.aggregate([
        { $match: { status: 'refunded' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', '$price'] } } } }
      ]).then(result => result[0]?.total || 0)
    ]);

    const totalRevenue = allTimeOrderFees + allTimePromotionFees;
    const periodRevenue = periodOrderFees + periodPromotionFees;

    const last7DaysStart = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [orderFeeTrend, promotionFeeTrend] = await Promise.all([
      Order.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: last7DaysStart } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            revenue: { $sum: { $ifNull: ['$platformFee', 0] } },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      PromotionPurchase.aggregate([
        { $match: { createdAt: { $gte: last7DaysStart } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            revenue: { $sum: { $ifNull: ['$totalAmount', 0] } },
            orders: { $sum: 0 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const trendMap = new Map();
    for (const row of orderFeeTrend) {
      trendMap.set(row._id, { _id: row._id, revenue: row.revenue || 0, orders: row.orders || 0 });
    }
    for (const row of promotionFeeTrend) {
      const existing = trendMap.get(row._id) || { _id: row._id, revenue: 0, orders: 0 };
      existing.revenue += row.revenue || 0;
      trendMap.set(row._id, existing);
    }

    const revenueTrend = Array.from(trendMap.values()).sort((a, b) => a._id.localeCompare(b._id));

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalRevenue,
          periodRevenue,
          pendingPayments,
          completedOrders,
          pendingWithdrawals,
          totalWithdrawals,
          platformFees,
          refunds
        },
        trends: {
          revenue: revenueTrend
        }
      }
    });
  } catch (error) {
    console.error('Get financial overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial overview',
      error: error.message
    });
  }
};

const getWithdrawalRequests = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = 'pending',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const withdrawalRequests = await WithdrawalRequest.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'fullName email username')
      .populate('processedBy', 'fullName email');

    const total = await WithdrawalRequest.countDocuments(filter);

    // Format data for frontend DataGrid (matching your existing structure)
    const formattedRequests = withdrawalRequests.map(formatWithdrawalRequestForAdmin);

    res.status(200).json({
      success: true,
      data: formattedRequests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      filters: {
        status,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Get withdrawal requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal requests',
      error: error.message
    });
  }
};

const approveWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { adminNote } = req.body;

    const withdrawal = await WithdrawalRequest.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve ${withdrawal.status} request`
      });
    }

    withdrawal.status = 'approved';
    withdrawal.adminNotes = adminNote;
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.userId;

    await withdrawal.save();

    // Update user's withdrawn amount
    const user = await User.findById(withdrawal.userId);
    if (user) {
      user.revenue.withdrawn = (user.revenue.withdrawn || 0) + withdrawal.amount;
      await user.save();
    }

    // Notify freelancer
    try {
      await notifyWithdrawalApproved(withdrawal.userId, withdrawal.amount, withdrawal._id);
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Withdrawal request approved',
      data: withdrawal
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve withdrawal',
      error: error.message
    });
  }
};

const rejectWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { reason } = req.body;

    const withdrawal = await WithdrawalRequest.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject ${withdrawal.status} request`
      });
    }

    withdrawal.status = 'rejected';
    withdrawal.rejectionReason = reason;
    withdrawal.adminNotes = reason;
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.userId;

    await withdrawal.save();

    // Return money to user's available balance
    const user = await User.findById(withdrawal.userId);
    if (user) {
      user.revenue.available = (user.revenue.available || 0) + withdrawal.amount;
      await user.save();
    }

    // Notify freelancer
    try {
      await notifyWithdrawalRejected(withdrawal.userId, withdrawal.amount, withdrawal._id, reason);
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Withdrawal request rejected',
      data: withdrawal
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject withdrawal',
      error: error.message
    });
  }
};

const getWithdrawalRequestDetail = async (req, res) => {
  try {
    const { withdrawalId } = req.params;

    const withdrawal = await WithdrawalRequest.findById(withdrawalId)
      .populate('userId', 'fullName email username')
      .populate('processedBy', 'fullName email');

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: formatWithdrawalRequestForAdmin(withdrawal)
    });
  } catch (error) {
    console.error('Get withdrawal request detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal request detail',
      error: error.message
    });
  }
};

const createWithdrawalRequestAdmin = async (req, res) => {
  try {
    const { userId, userEmail, amount, paymentMethod, accountDetails, notes } = req.body;

    const withdrawalAmount = Number(amount);
    if (!withdrawalAmount || Number.isNaN(withdrawalAmount) || withdrawalAmount < 10) {
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

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    } else if (userEmail) {
      user = await User.findOne({ email: userEmail });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const pendingRequest = await WithdrawalRequest.findOne({ userId: user._id, status: 'pending' });
    if (pendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'User already has a pending withdrawal request'
      });
    }

    if ((user.revenue?.available || 0) < withdrawalAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: $${user.revenue?.available || 0}`
      });
    }

    const withdrawalRequest = await WithdrawalRequest.create({
      userId: user._id,
      amount: withdrawalAmount,
      paymentMethod,
      accountDetails,
      notes
    });

    // Deduct from available balance (hold it)
    user.revenue.available -= withdrawalAmount;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: withdrawalRequest
    });
  } catch (error) {
    console.error('Create admin withdrawal request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create withdrawal request',
      error: error.message
    });
  }
};

// ==================== CONTENT MANAGEMENT ====================

const getAllReviews = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      rating,
      flagged,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (rating) filter.rating = parseInt(rating);
    if (flagged !== undefined) filter.isFlagged = flagged === 'true';

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reviews = await Review.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('reviewerId', 'fullName email username')
      .populate('revieweeId', 'fullName email username')
      .populate('orderId', 'status');

    const total = await Review.countDocuments(filter);

    // Format data for frontend DataGrid
    const formattedReviews = reviews.map((review) => ({
      _id: review._id,
      id: review._id,
      reviewerId: review.reviewerId?._id,
      reviewerName: review.reviewerId?.fullName,
      reviewerUsername: review.reviewerId?.username,
      revieweeId: review.revieweeId?._id,
      revieweeName: review.revieweeId?.fullName,
      revieweeUsername: review.revieweeId?.username,
      orderId: review.orderId?._id,
      orderStatus: review.orderId?.status,
      rating: review.rating,
      comment: review.comment,
      isFlagged: review.isFlagged,
      isHidden: review.isHidden,
      moderationReason: review.moderationReason,
      moderatedBy: review.moderatedBy,
      moderatedAt: review.moderatedAt,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: formattedReviews,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      filters: {
        rating,
        flagged,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

const moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { action, reason } = req.body; // action: 'approve', 'hide', 'delete'

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    switch (action) {
      case 'approve':
        review.isHidden = false;
        review.isFlagged = false;
        break;
      case 'hide':
        review.isHidden = true;
        review.moderationReason = reason;
        break;
      case 'delete':
        await Review.findByIdAndDelete(reviewId);
        return res.status(200).json({
          success: true,
          message: 'Review deleted successfully'
        });
    }

    review.moderatedAt = new Date();
    review.moderatedBy = req.userId;
    await review.save();

    res.status(200).json({
      success: true,
      message: `Review ${action}d successfully`,
      data: review
    });
  } catch (error) {
    console.error('Moderate review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate review',
      error: error.message
    });
  }
};

// ==================== COMMUNICATION MANAGEMENT ====================

const getContactMessages = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isRead,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const contacts = await Contact.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contact.countDocuments(filter);

    // Format data for frontend DataGrid (matching your existing structure)
    const formattedContacts = contacts.map((contact) => ({
      _id: contact._id,
      id: contact._id,
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      message: contact.message,
      isRead: contact.isRead,
      readAt: contact.readAt,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: formattedContacts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      filters: {
        isRead,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact messages',
      error: error.message
    });
  }
};

const markContactAsRead = async (req, res) => {
  try {
    const { contactId } = req.params;

    const contact = await Contact.findByIdAndUpdate(
      contactId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact marked as read',
      data: contact
    });
  } catch (error) {
    console.error('Mark contact as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark contact as read',
      error: error.message
    });
  }
};

// ==================== ANALYTICS ====================

const getUserAnalytics = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'User analytics feature coming soon',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics',
      error: error.message
    });
  }
};

const getRevenueAnalytics = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Revenue analytics feature coming soon', 
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
      error: error.message
    });
  }
};

const getPerformanceAnalytics = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Performance analytics feature coming soon',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance analytics',
      error: error.message
    });
  }
};

// ==================== PLATFORM SETTINGS ====================

const getVatSettings = async (req, res) => {
  try {
    const vatRates = await Vat.find();
    res.status(200).json({
      success: true,
      data: vatRates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch VAT rates',
      error: error.message
    });
  }
};

/**
 * Get VAT collected report
 * Shows total VAT collected with filters
 */
const getVatReport = async (req, res) => {
  try {
    const { 
      dateFrom, 
      dateTo, 
      country,
      page = 1,
      limit = 50
    } = req.query;

    // Build filter
    const filter = {
      isPaid: true,
      vatCollected: true
    };

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (country) {
      filter.clientCountry = country.toUpperCase();
    }

    // Get VAT summary
    const [
      orders,
      total,
      vatSummary
    ] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .populate('buyerId', 'fullName email')
        .populate('sellerId', 'fullName email'),
      Order.countDocuments(filter),
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalVatCollected: { $sum: '$vatAmount' },
            totalBaseAmount: { $sum: '$baseAmount' },
            totalOrders: { $sum: 1 },
            avgVatRate: { $avg: '$vatRate' }
          }
        }
      ])
    ]);

    // VAT by country
    const vatByCountry = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$clientCountry',
          vatCollected: { $sum: '$vatAmount' },
          orderCount: { $sum: 1 },
          avgVatRate: { $avg: '$vatRate' }
        }
      },
      { $sort: { vatCollected: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders: orders.map(o => ({
          _id: o._id,
          orderId: o._id,
          buyerName: o.buyerId?.fullName,
          buyerEmail: o.buyerId?.email,
          sellerName: o.sellerId?.fullName,
          clientCountry: o.clientCountry,
          baseAmount: o.baseAmount,
          vatRate: o.vatRate,
          vatRatePercentage: Math.round((o.vatRate || 0) * 100),
          vatAmount: o.vatAmount,
          totalAmount: o.totalAmount,
          currency: o.currency,
          reverseChargeApplied: o.reverseChargeApplied,
          createdAt: o.createdAt
        })),
        summary: vatSummary[0] || {
          totalVatCollected: 0,
          totalBaseAmount: 0,
          totalOrders: 0,
          avgVatRate: 0
        },
        byCountry: vatByCountry,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('VAT report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch VAT report',
      error: error.message
    });
  }
};

/**
 * Export VAT report as CSV
 */
const exportVatReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, country } = req.query;

    const filter = {
      isPaid: true,
      vatCollected: true
    };

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (country) {
      filter.clientCountry = country.toUpperCase();
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('buyerId', 'fullName email')
      .populate('sellerId', 'fullName email');

    // Generate CSV
    const csvRows = [
      'Order ID,Date,Client Country,Buyer,Seller,Base Amount,VAT Rate %,VAT Amount,Total Amount,Currency,Reverse Charge'
    ];

    orders.forEach(o => {
      csvRows.push([
        o._id,
        new Date(o.createdAt).toISOString().split('T')[0],
        o.clientCountry || '',
        o.buyerId?.fullName || '',
        o.sellerId?.fullName || '',
        o.baseAmount || 0,
        Math.round((o.vatRate || 0) * 100),
        o.vatAmount || 0,
        o.totalAmount || 0,
        o.currency || 'EUR',
        o.reverseChargeApplied ? 'Yes' : 'No'
      ].join(','));
    });

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=vat-report-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);

  } catch (error) {
    console.error('VAT export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export VAT report'
    });
  }
};

// ==================== MARKETING ====================

const getNewsletterSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const newsletters = await Newsletter.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await Newsletter.countDocuments();
    
    // Format data for frontend DataGrid
    const formattedNewsletters = newsletters.map((newsletter) => ({
      _id: newsletter._id,
      id: newsletter._id,
      email: newsletter.email,
      name: newsletter.name,
      isActive: newsletter.isActive,
      subscribedAt: newsletter.subscribedAt || newsletter.createdAt,
      unsubscribedAt: newsletter.unsubscribedAt,
      source: newsletter.source,
      preferences: newsletter.preferences,
      createdAt: newsletter.createdAt,
      updatedAt: newsletter.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      data: formattedNewsletters,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch newsletter subscribers',
      error: error.message
    });
  }
};

const getPromotions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    
    const promotions = await Promotion.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'fullName email username');
      
    const total = await Promotion.countDocuments(filter);
    
    // Format data for frontend DataGrid
    const formattedPromotions = promotions.map((promotion) => ({
      _id: promotion._id,
      id: promotion._id,
      userId: promotion.userId?._id,
      username: promotion.userId?.username,
      userEmail: promotion.userId?.email,
      userFullName: promotion.userId?.fullName,
      type: promotion.type,
      title: promotion.title,
      description: promotion.description,
      status: promotion.status,
      isActive: promotion.isActive,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      discount: promotion.discount,
      promotionCode: promotion.promotionCode,
      usageCount: promotion.usageCount,
      maxUsage: promotion.maxUsage,
      createdAt: promotion.createdAt,
      updatedAt: promotion.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      data: formattedPromotions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      filters: {
        status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch promotions',
      error: error.message
    });
  }
};

const updatePromotionStatus = async (req, res) => {
  try {
    const { promotionId } = req.params;
    const { status } = req.body;
    
    const promotion = await Promotion.findByIdAndUpdate(
      promotionId,
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Promotion status updated successfully',
      data: promotion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update promotion status',
      error: error.message
    });
  }
};

// ==================== NOTIFICATION MANAGEMENT ====================

const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, read } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (read !== undefined) filter.isRead = read === 'true';
    
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'fullName email username');
      
    const total = await Notification.countDocuments(filter);
    
    // Format data for frontend DataGrid
    const formattedNotifications = notifications.map((notification) => ({
      _id: notification._id,
      id: notification._id,
      userId: notification.userId?._id,
      username: notification.userId?.username,
      email: notification.userId?.email,
      userFullName: notification.userId?.fullName,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      readAt: notification.readAt,
      data: notification.data,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      data: formattedNotifications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      filters: {
        type,
        read
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

const markAllNotificationsAsReadAdmin = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

const sendBroadcastNotification = async (req, res) => {
  try {
    const { title, message, type, targetRole } = req.body;
    
    // Get target users
    const filter = {};
    if (targetRole && targetRole !== 'all') {
      filter.role = targetRole;
    }
    
    const targetUsers = await User.find(filter).select('_id');
    
    // Create notifications for all target users
    const notifications = targetUsers.map(user => ({
      userId: user._id,
      title,
      message,
      type: type || 'info',
      createdAt: new Date()
    }));
    
    await Notification.insertMany(notifications);
    
    res.status(200).json({
      success: true,
      message: `Notification sent to ${notifications.length} users`,
      data: { count: notifications.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send broadcast notification',
      error: error.message
    });
  }
};

// ==================== CONVERSATION MANAGEMENT ====================

const getConversations = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const conversations = await Conversation.find()
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('participants', 'fullName email username');
      
    const total = await Conversation.countDocuments();
    
    // Format data for frontend DataGrid
    const formattedConversations = conversations.map((conversation) => ({
      _id: conversation._id,
      id: conversation._id,
      participants: conversation.participants,
      participantNames: conversation.participants?.map(p => p.fullName).join(', '),
      participantUsernames: conversation.participants?.map(p => p.username).join(', '),
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      isActive: conversation.isActive,
      messageCount: conversation.messageCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      data: formattedConversations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
};

// ==================== PROJECT MANAGEMENT ====================

const getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    
    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'fullName email username');
      
    const total = await Project.countDocuments(filter);
    
    // Format data for frontend DataGrid
    const formattedProjects = projects.map((project) => ({
      _id: project._id,
      id: project._id,
      title: project.title,
      description: project.description,
      userId: project.userId?._id,
      username: project.userId?.username,
      userEmail: project.userId?.email,
      userFullName: project.userId?.fullName,
      category: project.category,
      status: project.status,
      isPublic: project.isPublic,
      isFeatured: project.isFeatured,
      images: project.images,
      technologies: project.technologies,
      adminNote: project.adminNote,
      moderatedBy: project.moderatedBy,
      moderatedAt: project.moderatedAt,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      data: formattedProjects,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      filters: {
        status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
};

const updateProjectStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, reason } = req.body;
    
    const project = await Project.findByIdAndUpdate(
      projectId,
      { status, adminNote: reason, updatedAt: new Date() },
      { new: true }
    );
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Project status updated successfully',
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update project status',
      error: error.message
    });
  }
};

// ==================== SENSITIVE MESSAGES ====================

const getSensitiveMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const sensitiveMessages = await Message.find({
      isFlagged: true
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('senderId', 'fullName email username')
      .populate('receiverId', 'fullName email username')
      .populate('conversationId');
      
    const total = await Message.countDocuments({ isFlagged: true });
    
    // Format data for frontend DataGrid (matching your existing structure)
    const formattedMessages = sensitiveMessages.map((message) => ({
      _id: message._id,
      id: message._id,
      conversationId: message.conversationId?._id,
      userId: message.senderId?._id,
      senderName: message.senderId?.fullName,
      senderUsername: message.senderId?.username,
      senderEmail: message.senderId?.email,
      receiverId: message.receiverId?._id,
      receiverName: message.receiverId?.fullName,
      receiverUsername: message.receiverId?.username,
      desc: message.content || message.desc,
      content: message.content,
      isFlagged: message.isFlagged,
      flagReason: message.flagReason,
      moderatedBy: message.moderatedBy,
      moderatedAt: message.moderatedAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      data: formattedMessages,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensitive messages',
      error: error.message
    });
  }
};

// ==================== SYSTEM MANAGEMENT ====================

const getSystemLogs = async (req, res) => {
  try {
    // This is a placeholder for system logs
    // In a real implementation, you'd integrate with your logging system
    res.status(200).json({
      success: true,
      message: 'System logs feature coming soon',
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system logs',
      error: error.message
    });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    // Placeholder for audit logs
    res.status(200).json({
      success: true,
      message: 'Audit logs feature coming soon',
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
};

const systemHealth = async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
};

// ==================== BULK OPERATIONS ====================

const bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, action, data } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    let result;
    switch (action) {
      case 'block':
        result = await User.updateMany(
          { _id: { $in: userIds }, role: { $ne: 'admin' } },
          { 
            isBlocked: true, 
            blockReason: data.reason,
            blockedAt: new Date()
          }
        );
        break;
      case 'unblock':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { 
            isBlocked: false,
            $unset: { blockReason: 1, blockedAt: 1, blockExpiresAt: 1 }
          }
        );
        break;
      case 'verify':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isVerified: true }
        );
        break;
      case 'updateRole':
        result = await User.updateMany(
          { _id: { $in: userIds }, role: { $ne: 'admin' } },
          { role: data.role }
        );
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action specified'
        });
    }

    res.status(200).json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk operation',
      error: error.message
    });
  }
};

// ==================== ADMIN MANAGEMENT ====================

const createAdmin = async (req, res) => {
  try {
    const { email, password, fullName, username, permissions } = req.body;

    if (!req.user.hasPermission('user_management')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create admin users'
      });
    }

    const result = await createAdminUser({
      email,
      password,
      fullName,
      username,
      permissions
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: result.admin
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user',
      error: error.message
    });
  }
};

const updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.permissions = permissions;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User permissions updated successfully',
      data: {
        userId,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user permissions',
      error: error.message
    });
  }
};

module.exports = {
  // Dashboard & Analytics
  getDashboardStats,
  getUserAnalytics,
  getRevenueAnalytics,
  getPerformanceAnalytics,
  
  // User Management
  getAllUsers,
  getUserDetails,
  updateUserRole,
  blockUser,
  unblockUser,
  verifyUser,
  warnUser,
  deleteUser,
  
  // Job/Gig Management
  getAllJobs,
  updateJobStatus,
  deleteJob,
  
  // Order Management
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  deleteOrder,
  
  // Financial Management
  getFinancialOverview,
  getWithdrawalRequests,
  getWithdrawalRequestDetail,
  createWithdrawalRequestAdmin,
  approveWithdrawal,
  rejectWithdrawal,
  
  // Content Management
  getAllReviews,
  moderateReview,
  getSensitiveMessages,
  
  // Communication Management
  getContactMessages,
  markContactAsRead,
  getConversations,
  
  // System Management
  getSystemLogs,
  getAuditLogs,
  systemHealth,
  
  // Platform Settings & VAT
  getVatSettings,
  getVatReport,
  exportVatReport,
  
  // Marketing
  getNewsletterSubscribers,
  getPromotions,
  updatePromotionStatus,
  
  // Notification Management
  getNotifications,
  markAllNotificationsAsReadAdmin,
  sendBroadcastNotification,
  
  // Project Management
  getProjects,
  updateProjectStatus,
  
  // Bulk Operations
  bulkUpdateUsers,
  
  // Admin Management
  createAdmin,
  updateUserPermissions
}; 