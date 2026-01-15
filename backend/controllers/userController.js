const User = require("../models/User");
const { sendUserNotificationEmail } = require("../services/emailService");
const UserProfile = require('../models/UserProfile');
const Reviews = require('../models/Review');
const Job = require('../models/Job');
const Order = require('../models/Order');
const { uploadDocuments } = require("./uploadController");

const getAllUsers = async (req, res) => {
    try {
      const users = await User.find(); // Fetch all users from the database
  
      if (!users) {
        return res.status(404).json({ message: "No users found" });
      }
  
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };

const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).send("User not found!");
        }

        if (req.userId !== user._id.toString()) {
           return res.status(403).send("You can only delete your account!");
        }

        await User.findByIdAndDelete(req.params.id);

        res.status(200).send("Deleted");
    } catch (error) {
        next(error);
    }
};

const getTotalUsers = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({});
        res.status(200).json({ totalUsers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getVerifiedSellers = async (req, res) => {
  try {
    let query = { isSeller: true };
    
    const { userId, userRole, isSeller } = req;
    
    if (userId && userRole) {
      const requestingUser = await User.findById(userId);
      
      if (requestingUser) {
        if (requestingUser.role === 'admin') {
        } 
        else if (requestingUser.role === 'freelancer' && requestingUser.sellerType === 'individual') {
          query._id = userId;
        }
        else if (requestingUser.role === 'freelancer' && requestingUser.sellerType === 'company') {
          query._id = userId;
        }
        else if (requestingUser.role === 'client') {
        }
      }
    }

    const verifiedSellers = await User.find(
      query,
      '_id fullName documentImages isCompany isBlocked isWarned email username profilePicture isVerified role sellerType documentUrl createdAt'
    ).lean();

    const userIds = verifiedSellers.map(u => u._id);
    const userProfiles = await UserProfile.find({ userId: { $in: userIds } })
      .select('userId profilePicture')
      .lean();

    const profileMap = {};
    userProfiles.forEach(profile => {
      profileMap[profile.userId.toString()] = profile.profilePicture;
    });

    const enriched = verifiedSellers.map(u => ({
      ...u,
      profilePicture: profileMap[u._id.toString()] || u.profilePicture
    }));

    res.status(200).json(enriched);

  } catch (error) {
    console.error('Error fetching verified sellers:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
    });
  }
};

const warnUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.warningCount = (user.warningCount || 0) + 1;
    user.lastWarningDate = new Date();
    await user.save();

    try {
      await sendUserNotificationEmail(user.email, 'warn');
    } catch (emailError) {
      console.error('Failed to send warning email:', emailError);
    }

    res.status(200).json({ 
      success: true, 
      message: "User has been warned successfully",
      warningCount: user.warningCount
    });
  } catch (error) {
    console.error('Error warning user:', error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isBlocked = true;
    user.blockReason = reason || 'Violated platform guidelines';
    user.blockedAt = new Date();
    await user.save();

    try {
      await sendUserNotificationEmail(user.email, 'block');
    } catch (emailError) {
      console.error('Failed to send block email:', emailError);
    }

    res.status(200).json({ 
      success: true, 
      message: "User has been blocked successfully" 
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


const createOrUpdateProfile = async (req, res) => {
  try {
    const { userId, profilePicture, location, description, skills } = req.body;

    let userProfile = await UserProfile.findOne({ userId });

    if (userProfile) {
      userProfile.profilePicture = profilePicture;
      userProfile.location = location;
      userProfile.description = description;
      userProfile.skills = skills;
    } else {
      userProfile = new UserProfile({
        userId,
        profilePicture,
        location,
        description,
        skills
      });
    }

    await userProfile.save();

    res.status(200).json({ 
      success: true, 
      code: 'PROFILE_UPDATE_SUCCESS', 
      message: 'User profile updated successfully', 
      data: userProfile 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

    




const updateSingleAttribute = async (req, res) => {
  try {
    const { userId } = req;
    const updates = req.body; 
    let profilePictureUrl;

    if (req.files ) {
      const [uploadedUrl] = await uploadDocuments(req);
      profilePictureUrl = uploadedUrl; 
    }

    const userFields = ['fullName', 'username', 'email', 'sellerType'];
    const userUpdates = {};
    const profileUpdates = {};
    
    for (let key in updates) {
      if (updates[key] !== undefined && updates[key] !== '') {
        if (userFields.includes(key)) {
          userUpdates[key] = updates[key];
        } else if (key !== 'currentPassword' && key !== 'newPassword') {
          profileUpdates[key] = updates[key];
        }
      }
    }
    
    if (updates.newPassword && updates.currentPassword) {
      const user = await User.findById(userId);
      const isMatch = await user.matchPassword(updates.currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      user.password = updates.newPassword;
      await user.save(); // This will trigger the pre-save hook to hash the password
    } else if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(userId, userUpdates);
    }
    
    if (profilePictureUrl) {
      await User.findByIdAndUpdate(userId, { profilePicture: profilePictureUrl });
    }

    let userProfile = await UserProfile.findOne({ userId });

    if (!userProfile) {
      userProfile = new UserProfile({
        userId,
        ...profileUpdates,
        ...(profilePictureUrl && { profilePicture: profilePictureUrl }),
      });
    } else {
      for (let key in profileUpdates) {
        if (profileUpdates[key] !== undefined) {
          userProfile[key] = profileUpdates[key];
        }
      }

      if (profilePictureUrl) {
        userProfile.profilePicture = profilePictureUrl;
      }
    }

    await userProfile.save();
    
    const updatedUser = await User.findById(userId).select('-password');

    res.status(200).json({
      success: true,
      code: 'PROFILE_UPDATE_SUCCESS',
      message: "Profile updated successfully",
      data: {
        ...userProfile.toObject(),
        ...updatedUser.toObject()
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getSellerData = async (req, res) => {
  try {
    const { userId } = req; 
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    let responseData = {
      fullName: null,
      username: null,
      createdAt: null,
      location: null,
      country: null,
      countryCode: null,
      profileHeadline: '',
      profilePicture:'',
      description: '',
      skills: [],
      reviews: [],
      averageRating: 0,
      completedOrders: 0,
      totalReviews: 0,
      revenue: {
        total: 0,
        available: 0,
        pending: 0,
        withdrawn: 0,
      },
    };

    const user = await User.findById(userId).select('fullName username createdAt revenue');
    if (user) {
      responseData.fullName = user.fullName;
      responseData.username = user.username;
      responseData.createdAt = user.createdAt;
      if (user.revenue) {
        responseData.revenue = {
          total: user.revenue.total || 0,
          available: user.revenue.available || 0,
          pending: user.revenue.pending || 0,
          withdrawn: user.revenue.withdrawn || 0,
        };
      }
    }

    const userProfile = await UserProfile.findOne({ userId }).select('location country countryCode profilePicture profileHeadline description skills');
    if (userProfile) {
      responseData.location = userProfile.location;
      responseData.country = userProfile.country;
      responseData.countryCode = userProfile.countryCode;
      responseData.profileHeadline=userProfile.profileHeadline,
      responseData.profilePicture = userProfile.profilePicture,
      responseData.description = userProfile.description;
      responseData.skills = userProfile.skills;
    }

    const sellerIdStr = userId.toString();
    const mongoose = require('mongoose');
    const sellerIdObj = mongoose.Types.ObjectId.isValid(sellerIdStr) ? new mongoose.Types.ObjectId(sellerIdStr) : null;
    
    try {
      const ratingResult = await Reviews.aggregate([
        { $match: { $or: [{ sellerId: sellerIdStr }, ...(sellerIdObj ? [{ sellerId: sellerIdObj }] : [])] } },
        { $group: { _id: null, avgRating: { $avg: '$star' }, count: { $sum: 1 } } }
      ]);
      responseData.averageRating = ratingResult[0]?.avgRating || 0;
      responseData.totalReviews = ratingResult[0]?.count || 0;
    } catch (e) {
      console.error('Error fetching average rating:', e);
    }

    try {
      responseData.completedOrders = await Order.countDocuments({
        $or: [{ sellerId: sellerIdStr }, ...(sellerIdObj ? [{ sellerId: sellerIdObj }] : [])],
        status: 'completed'
      });
    } catch (e) {
      console.error('Error fetching completed orders:', e);
    }

    const sellerReviews = await Reviews.find({ 
      $or: [{ sellerId: sellerIdStr }, ...(sellerIdObj ? [{ sellerId: sellerIdObj }] : [])] 
    })
      .sort({ createdAt: -1 })
      .lean();

    if (sellerReviews.length > 0) {
      const reviewGigIds = [...new Set(sellerReviews.map((r) => r.gigId).filter(Boolean))];
      const gigs = await Job.find({ _id: { $in: reviewGigIds } }).select('_id title').lean();
      const gigTitleMap = {};
      gigs.forEach((g) => {
        gigTitleMap[g._id.toString()] = g.title;
      });

      const reviewerIds = [...new Set(sellerReviews.map(r => r.userId).filter(Boolean))];
      const reviewers = await User.find({ _id: { $in: reviewerIds } }).select('fullName username').lean();
      const reviewerProfiles = await UserProfile.find({ userId: { $in: reviewerIds } }).select('userId profilePicture').lean();
      
      const reviewerMap = {};
      reviewers.forEach(r => {
        const profile = reviewerProfiles.find(p => p.userId.toString() === r._id.toString());
        reviewerMap[r._id.toString()] = {
          fullName: r.fullName,
          username: r.username,
          profilePicture: profile?.profilePicture
        };
      });

      responseData.reviews = sellerReviews.map(review => {
        const reviewerInfo = reviewerMap[review.userId?.toString()] || {};
        return {
          _id: review._id,
          gigId: gigTitleMap[review.gigId]
            ? { title: gigTitleMap[review.gigId] }
            : review.gigId,
          user: {
            username: reviewerInfo.username || review.reviewerName || 'Anonymous',
            fullName: reviewerInfo.fullName || review.reviewerName || 'Anonymous',
            profilePicture: reviewerInfo.profilePicture || review.reviewerImage || undefined,
          },
          star: review.star,
          desc: review.desc,
          createdAt: review.createdAt,
        };
      });
    }

    try {
      const earningsAgg = await Order.aggregate([
        { $match: { $or: [{ sellerId: sellerIdStr }, ...(sellerIdObj ? [{ sellerId: sellerIdObj }] : [])], status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ]);

      const computedTotal = earningsAgg[0]?.total || 0;

      responseData.revenue = {
        total: computedTotal,
        available: responseData.revenue?.available || 0,
        pending: responseData.revenue?.pending || 0,
        withdrawn: responseData.revenue?.withdrawn || 0
      };
    } catch (e) {
      console.error("Error calculating earnings:", e);
    }


    return res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

 const getUserWithProjects = async (req, res) => {
  try {
    const { username } = req.params;

    const userData = await User.aggregate([
      { $match: { username: username } }, 
      {
        $lookup: {
          from: "userprofiles", 
          localField: "_id",
          foreignField: "userId",
          as: "profile",
        },
      },
      {
        $lookup: {
          from: "projects", 
          localField: "_id",
          foreignField: "userId",
          as: "projects",
        },
      },
      {
        $project: {
          username: 1,
          createdAt: 1,
          "profile.profileHeadline": 1,
           "profile.description" :1,
          "profile.profilePicture": 1,
          "profile.location":   1,
          "profile.skills": 1,
          "projects.title": 1,
          "projects.description": 1,
          "projects.image": 1,
          "projects.skills": 1,
          "projects.githubLink": 1,
          "projects.liveDemoLink": 1,
        },
      },
    ]);

    if (!userData || userData.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userData[0];

    const responseData = {
      username: user.username,
      headline: user.profile?.[0]?.profileHeadline || "",
      location: user.profile?.[0]?.location || "",
      aboutMe : user.profile?.[0]?.description || "",
      createdAt: user.createdAt,
      profilePicture: user.profile?.[0]?.profilePicture || "",  
      skillsArray: user.profile?.[0]?.skills || [],
      projects: user.projects.map((project) => ({
        title: project.title,
        description: project.description,
        image: project.image,
        skills: project.skills,
        githubLink: project.githubLink,
        demoLink: project.liveDemoLink,
      })),
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateDocumentStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.documentStatus !== 'pending') {
      return res.status(400).json({ message: 'Document status must be "pending" to update.' });
    }

    user.documentStatus = status;
    await user.save();

    res.status(200).json({
      success: true,
      code: 'DOCUMENT_STATUS_UPDATED',
      message: `Document status updated to "${status}" successfully.`,
      user: {
        id: user._id,
        documentStatus: user.documentStatus
      }
    });
  } catch (error) {
    console.error('Error updating document status:', error);
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Internal server error.' });
  }
};


const getFavorites = async (req, res) => {
  try {
    const { userId } = req;
    
    const user = await User.findById(userId).populate('favorites');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const favoritesWithDetails = await Promise.all(
      (user.favorites || []).map(async (gig) => {
        if (!gig) return null;
        
        const seller = await User.findById(gig.sellerId).select('username fullName').lean();
        
        const sellerProfile = await UserProfile.findOne({ userId: gig.sellerId }).lean();
        
        const reviews = await Reviews.find({ gigId: gig._id });
        const averageRating = reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + r.star, 0) / reviews.length 
          : 0;

        return {
          _id: gig._id,
          title: gig.title,
          description: gig.description,
          photos: gig.photos,
          pricingPlan: gig.pricingPlan,
          cat: gig.cat,
          sales: gig.sales,
          seller: {
            _id: gig.sellerId,
            username: seller?.username || 'Unknown',
            fullName: seller?.fullName || 'Unknown',
            profilePicture: sellerProfile?.profilePicture || null
          },
          rating: averageRating,
          reviewsCount: reviews.length,
          createdAt: gig.createdAt
        };
      })
    );

    res.status(200).json({
      favorites: favoritesWithDetails.filter(Boolean),
      count: favoritesWithDetails.filter(Boolean).length
    });
  } catch (error) {
    console.error('Error getting favorites:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const addToFavorites = async (req, res) => {
  try {
    const { userId } = req;
    const { gigId } = req.body;

    if (!gigId) {
      return res.status(400).json({ message: 'Gig ID is required.' });
    }

    const gig = await Job.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.favorites && user.favorites.includes(gigId)) {
      return res.status(400).json({ message: 'Gig already in favorites.' });
    }

    user.favorites = user.favorites || [];
    user.favorites.push(gigId);
    await user.save();

    res.status(200).json({ 
      message: 'Added to favorites successfully.',
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const removeFromFavorites = async (req, res) => {
  try {
    const { userId } = req;
    const { gigId } = req.params;

    if (!gigId) {
      return res.status(400).json({ message: 'Gig ID is required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.favorites = (user.favorites || []).filter(
      (favId) => favId.toString() !== gigId
    );
    await user.save();

    res.status(200).json({ 
      message: 'Removed from favorites successfully.',
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { userId } = req;
    const { gigId } = req.body;

    if (!gigId) {
      return res.status(400).json({ message: 'Gig ID is required.' });
    }

    const gig = await Job.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.favorites = user.favorites || [];
    const isCurrentlyFavorite = user.favorites.some(
      (favId) => favId.toString() === gigId
    );

    if (isCurrentlyFavorite) {
      user.favorites = user.favorites.filter(
        (favId) => favId.toString() !== gigId
      );
      await user.save();
      return res.status(200).json({ 
        message: 'Removed from favorites.',
        isFavorite: false,
        favorites: user.favorites
      });
    } else {
      user.favorites.push(gigId);
      await user.save();
      return res.status(200).json({ 
        message: 'Added to favorites.',
        isFavorite: true,
        favorites: user.favorites
      });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const checkFavorite = async (req, res) => {
  try {
    const { userId } = req;
    const { gigId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isFavorite = (user.favorites || []).some(
      (favId) => favId.toString() === gigId
    );

    res.status(200).json({ isFavorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const searchFreelancers = async (req, res) => {
  try {
    const { q, limit = 10, skill } = req.query;

    if (!q || q.trim().length < 2) {
      if (!skill) return res.status(200).json([]);
    }

    const searchRegex = new RegExp(q?.trim() || "", 'i');
    
    const matchQuery = {
      isSeller: true,
      $or: [
        { fullName: { $regex: searchRegex } },
        { username: { $regex: searchRegex } }
      ]
    };

    const results = await User.aggregate([
      { $match: matchQuery },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'userprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      ...(skill ? [{
        $match: { 'profile.skills': { $regex: new RegExp(skill, 'i') } }
      }] : []),
      {
        $lookup: {
          from: 'orders',
          let: { userIdStr: { $toString: '$_id' } },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $eq: ['$sellerId', '$$userIdStr'] },
                    { $eq: ['$status', 'completed'] }
                  ] 
                } 
              } 
            }
          ],
          as: 'completedOrders'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          let: { userIdStr: { $toString: '$_id' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$sellerId', '$$userIdStr'] } } },
            { $sort: { createdAt: -1 } }
          ],
          as: 'allReviews'
        }
      },
      {
        $lookup: {
          from: 'jobs',
          let: { userIdStr: { $toString: '$_id' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$sellerId', '$$userIdStr'] } } }
          ],
          as: 'allGigs'
        }
      },
      {
        $addFields: {
          completedOrdersCount: { $size: '$completedOrders' },
          totalReviews: { $size: '$allReviews' },
          averageRating: { $avg: '$allReviews.star' },
          recentReviews: { $slice: ['$allReviews', 5] },
          totalGigsCount: { $size: '$allGigs' }
        }
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          username: 1,
          profilePicture: '$profile.profilePicture',
          profileHeadline: '$profile.profileHeadline',
          skills: '$profile.skills',
          country: '$profile.country',
          completedOrders: '$completedOrdersCount',
          averageRating: { $ifNull: ['$averageRating', 0] },
          totalReviews: 1,
          recentReviews: 1,
          totalGigs: '$totalGigsCount'
        }
      }
    ]);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error searching freelancers:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const getFreelancerProfile = async (req, res) => {
  try {
    const { username } = req.params;

    let user = await User.findOne({ username, isSeller: true })
      .select('_id fullName username email createdAt isSeller isCompany');

    if (!user) {
      user = await User.findOne({ username })
        .select('_id fullName username email createdAt isSeller isCompany');
    }

    if (!user) {
      return res.status(404).json({ message: 'Freelancer not found.' });
    }

    const userId = user._id;

    const userProfile = await UserProfile.findOne({ userId })
      .select('profilePicture profileHeadline description skills location country countryCode languages education certifications');

    let gigs = await Job.find({ sellerId: userId.toString() })
      .select('_id title cat subCat description pricingPlan photos sales totalStars starNumber createdAt');

    const { applyPromotionPriorities } = require('../utils/gigVisibility');
    gigs = await applyPromotionPriorities(gigs);

    const gigIds = gigs.map(g => g._id);
    const reviews = await Reviews.find({ gigId: { $in: gigIds } })
      .populate('userId', 'fullName username profilePicture')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((acc, r) => acc + r.star, 0) / totalReviews
      : 0;

    let avgPrice = 0;
    if (gigs.length > 0) {
      const prices = gigs.map(g => g.pricingPlan?.basic?.price || 0).filter(p => p > 0);
      avgPrice = prices.length > 0 
        ? prices.reduce((a, b) => a + b, 0) / prices.length 
        : 0;
    }

    const Order = require('../models/Order');
    const allSellerOrders = await Order.find({
      sellerId: userId.toString()
    }).select('status statusHistory price');

    const completedOrdersList = allSellerOrders.filter(o => o.status === 'completed');
    const completedOrdersCount = completedOrdersList.length;
    
    const totalEarnings = completedOrdersList.reduce((acc, o) => acc + (o.price || 0), 0);
    
    
    let totalDeliveryHours = 0;
    let countedDeliveries = 0;
    
    completedOrdersList.forEach(order => {
      const acceptedEntry = order.statusHistory?.find(h => ['accepted', 'started'].includes(h.status));
      const deliveredEntry = order.statusHistory?.find(h => h.status === 'delivered');
      
      if (acceptedEntry && deliveredEntry) {
        const diff = new Date(deliveredEntry.changedAt) - new Date(acceptedEntry.changedAt);
        totalDeliveryHours += diff / (1000 * 60 * 60);
        countedDeliveries++;
      }
    });

    const avgDeliveryHours = countedDeliveries > 0 ? (totalDeliveryHours / countedDeliveries) : 0;
    let avgDeliveryTimeStr = "N/A";
    if (avgDeliveryHours > 0) {
      if (avgDeliveryHours < 24) {
        avgDeliveryTimeStr = `${Math.round(avgDeliveryHours)} hours`;
      } else {
        const days = Math.floor(avgDeliveryHours / 24);
        const hours = Math.round(avgDeliveryHours % 24);
        avgDeliveryTimeStr = days === 1 ? '1 day' : `${days} days`;
        if (hours > 0) avgDeliveryTimeStr += ` ${hours}h`;
      }
    }

    const acceptedAtLeastOnce = allSellerOrders.filter(o => 
      o.statusHistory?.some(h => ['accepted', 'started'].includes(h.status))
    );
    const completionRate = acceptedAtLeastOnce.length > 0
      ? (completedOrdersCount / acceptedAtLeastOnce.length) * 100
      : 100;

    const successReviews = reviews.filter(r => r.star >= 4).length;
    const successRate = totalReviews > 0
      ? (successReviews / totalReviews) * 100
      : 100;

    const salesMapAgg = await Order.aggregate([
      { $match: { gigId: { $in: gigIds.map(id => id.toString()) }, status: 'completed' } },
      { $group: { _id: '$gigId', count: { $sum: 1 } } }
    ]);
    const salesCountObj = {};
    salesMapAgg.forEach(item => {
      salesCountObj[item._id] = item.count;
    });

    const formattedGigs = gigs.map(gig => {
      const gigReviews = reviews.filter(r => r.gigId.toString() === gig._id.toString());
      const gigRating = gigReviews.length > 0
        ? gigReviews.reduce((acc, r) => acc + r.star, 0) / gigReviews.length
        : 0;
      
      return {
        _id: gig._id,
        title: gig.title,
        category: gig.cat,
        subCategory: gig.subCat,
        description: gig.description,
        image: gig.photos?.[0] || null,
        price: gig.pricingPlan?.basic?.price || 0,
        deliveryTime: gig.pricingPlan?.basic?.deliveryTime || 0,
        sales: salesCountObj[gig._id.toString()] || 0,
        rating: +gigRating.toFixed(1),
        reviewCount: gigReviews.length,
        createdAt: gig.createdAt,
        promotionPriority: gig.promotionPriority || 0
      };
    });

    const formattedReviews = reviews.slice(0, 10).map(r => ({
      _id: r._id,
      gigId: r.gigId,
      star: r.star,
      desc: r.desc,
      user: r.userId ? {
        fullName: r.userId.fullName,
        username: r.userId.username,
        profilePicture: r.userId.profilePicture || r.reviewerImage || null
      } : { 
        fullName: r.reviewerName || 'Anonymous', 
        username: 'anonymous',
        profilePicture: r.reviewerImage || null
      },
      createdAt: r.createdAt
    }));

    const response = {
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        memberSince: user.createdAt,
        isCompany: user.isCompany
      },
      profile: {
        profilePicture: userProfile?.profilePicture || null,
        profileHeadline: userProfile?.profileHeadline || null,
        description: userProfile?.description || null,
        skills: userProfile?.skills || [],
        location: userProfile?.location || null,
        country: userProfile?.country || null,
        countryCode: userProfile?.countryCode || null,
        languages: userProfile?.languages || [],
        education: userProfile?.education || [],
        certifications: userProfile?.certifications || []
      },
      stats: {
        totalGigs: gigs.length,
        completedOrders: completedOrdersCount,
        totalReviews,
        averageRating: +averageRating.toFixed(1),
        averagePrice: +avgPrice.toFixed(2),
        totalEarnings: +totalEarnings.toFixed(2),
        avgDeliveryTime: avgDeliveryTimeStr,
        completionRate: +completionRate.toFixed(1),
        successRate: +successRate.toFixed(1)
      },
      gigs: formattedGigs,
      reviews: formattedReviews
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting freelancer profile:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const getClientProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password -verificationToken -verificationTokenExpiry');
    
    if (!user) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    const userProfile = await UserProfile.findOne({ userId: user._id });
    
    const Order = require('../models/Order');
    const orders = await Order.find({ buyerId: userId });
    
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const totalSpent = orders
      .filter(o => o.isPaid)
      .reduce((sum, o) => sum + (o.price || 0), 0);
    
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      profilePicture: userProfile?.profilePicture || user.profilePicture,
      country: userProfile?.country,
      createdAt: user.createdAt,
      isVerified: user.isVerified,
      isCompany: user.isCompany,
      totalOrdersPlaced: orders.length,
      totalSpent: totalSpent
    });
  } catch (error) {
    console.error('Error getting client profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { deleteUser ,getTotalUsers,getAllUsers, warnUser, blockUser,getVerifiedSellers,updateSingleAttribute,createOrUpdateProfile,getSellerData,getUserWithProjects,updateDocumentStatus, getFavorites, addToFavorites, removeFromFavorites, toggleFavorite, checkFavorite, searchFreelancers, getFreelancerProfile, getClientProfile};
