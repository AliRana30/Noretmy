const mongoose = require("mongoose");
const Job = require("../models/Job");
const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const Reviews = require("../models/Review");
const SellerBadge = require("../models/SellerBadge");
const {
  translateJob,
  translateReviews,
} = require("../services/translateService");
const {
  singleJobPromotionMonthlySubscriptionUtil,
} = require("./promotionController");
const getUsdToEurRate = require("../services/currencyConversion");
const { getCountryInfo } = require("./authController");
const { applyDiscountUtil } = require("../services/applyDiscount");
const { uploadDocuments } = require("./uploadController");
const { translateText, translateJSON } = require("../utils/translateText");
const { getSellerStatistics } = require("../services/sellerService");


const createJob = async (req, res) => {
  const { userId } = req;

  if (!userId) {
    return res.status(401).json({ message: "You are not logged in!" });
  }

  try {
    const {
      title,
      cat,
      description,
      keywords,
      whyChooseMe,
      pricingPlan,
      addons,
      faqs,
      subCat,
      jobStatus,
    } = req.body;

    const user = await User.findById(userId);
    const seller = user.isSeller;

    if (!seller) {
      return res.status(401).json({ message: "You are not allowed to do so!" });
    }

    const jobs = await Job.find({ sellerId: userId.toString() });

    if (jobs.length >= 5) {
      return res.status(400).json({ message: "You cannot create more than 5 gigs." });
    }

    if (!title || !cat || !description) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const documentUrls = await uploadDocuments(req);

    let parsedFaqs = [];
    let parsedWhyChooseMe = [];
    let parsedPricingPlan = {};
    let parsedAddons = [];

    try {
      if (faqs) parsedFaqs = JSON.parse(faqs);
      if (whyChooseMe) parsedWhyChooseMe = JSON.parse(whyChooseMe);
      if (pricingPlan) parsedPricingPlan = JSON.parse(pricingPlan);
      if (addons) parsedAddons = JSON.parse(addons);
    } catch (err) {
      return res.status(400).json({ message: "Invalid JSON format in one of the fields", error: err.message });
    }

    const finalJobStatus = jobStatus && jobStatus.trim() !== '' ? jobStatus : 'Active';

    const newJob = new Job({
      title,
      cat,
      subCat,
      description,
      keywords,
      whyChooseMe: parsedWhyChooseMe,
      pricingPlan: parsedPricingPlan,
      addons: parsedAddons,
      faqs: parsedFaqs,
      jobStatus: finalJobStatus,
      photos: documentUrls,
      upgradeOption: "free",
      sellerId: userId,
    });

    await newJob.save();

    res.status(201).json({ 
      success: true, 
      code: 'GIG_CREATED', 
      message: 'Gig created successfully', 
      data: newJob 
    });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};























const getAllJobs = async (req, res) => {
  try {
    const {
      min,
      max,
      keywords,
      deliveryTime,
      sold,
      search,
      categories,
      lang = "en",
      showAll = "false" // Optional: show all jobs including unavailable
    } = req.query;

    const filters = {};
    
    if (showAll !== "true") {
      filters.jobStatus = { $in: ['Available', 'active', 'Active'] };
    }

    if (min || max) {
      const priceFilter = {};
      if (min) priceFilter.$gte = parseFloat(min);
      if (max) priceFilter.$lte = parseFloat(max);
      
      filters["pricingPlan.basic.price"] = priceFilter;
    }

    if (keywords) {
      const keywordRegexes = keywords.split(',').map(k => new RegExp(k.trim(), 'i'));
      filters.keywords = { $in: keywordRegexes };
    }

    if (deliveryTime) {
      const numericDeliveryTime = parseInt(deliveryTime);
      
      if (!isNaN(numericDeliveryTime)) {
        filters["pricingPlan.basic.deliveryTime"] = {
          $lte: numericDeliveryTime,
        };
      } else {
        const deliveryMap = {
          "24 hours": 1,
          "1 day": 1,
          "up to 3 days": 3,
          "up to 1 week": 7,
          "up to 1 month": 30,
          "Anytime": Infinity,
        };
        filters["pricingPlan.basic.deliveryTime"] = {
          $lte: deliveryMap[deliveryTime] ?? Infinity,
        };
      }
    }

    if (sold === "true") {
      filters.sold = true;
    }

    const escapeRegex = (text) => {
      return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    };

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filters.$or = [
        { title: { $regex: regex } },
        { description: { $regex: regex } }
      ];
    }

    if (categories) {
      const categoryFilters = categories.split(',').map(entry => {
        const parts = entry.split('›').map(e => e.trim());
        if (parts.length === 2) {
          return {
            $and: [
              { cat: { $regex: new RegExp(escapeRegex(parts[0]), 'i') } },
              { subCat: { $regex: new RegExp(escapeRegex(parts[1]), 'i') } }
            ]
          };
        } else {
          return { cat: { $regex: new RegExp(escapeRegex(parts[0]), 'i') } };
        }
      });
      
      if (filters.$or) {
        filters.$and = [
          { $or: filters.$or },
          { $or: categoryFilters }
        ];
        delete filters.$or;
      } else {
        filters.$or = categoryFilters;
      }
    }

    const projection = {
      title: 1,
      cat: 1,
      subCat: 1,
      upgradeOption: 1,
      pricingPlan: 1,
      photos: 1,
      sales: 1,
      totalStars: 1,
      starNumber: 1,
      sellerId: 1,
      jobStatus: 1,
      createdAt: 1,
      updatedAt: 1,
    };

    const jobs = await Job.find(filters, projection).lean();

    if (!jobs.length) {
      return res.status(200).json([]);
    }

    if (lang !== 'en') {
      const textsToTranslate = {
        title: [],
        cat: [],
        subCat: [],
        upgradeOption: [],
      };

      for (const job of jobs) {
        textsToTranslate.title.push(job.title || "");
        textsToTranslate.cat.push(job.cat || "");
        textsToTranslate.subCat.push(job.subCat || "");
        textsToTranslate.upgradeOption.push(job.upgradeOption || "");
      }

      const [titles, cats, subCats, upgrades] = await Promise.all([
        translateText(textsToTranslate.title, lang),
        translateText(textsToTranslate.cat, lang),
        translateText(textsToTranslate.subCat, lang),
        translateText(textsToTranslate.upgradeOption, lang),
      ]);

      jobs.forEach((job, i) => {
        job.title = titles[i];
        job.cat = cats[i];
        job.subCat = subCats[i];
        job.upgradeOption = upgrades[i];
      });
    }

    const upgradePriority = {
      homepage: 1,
      premium: 2,
      sponsored: 3,
      standard: 4,
      basic: 5,
      featured: 6,
      free: 7,
      null: 8,
      undefined: 9,
    };

    const groupMap = new Map();

    for (const job of jobs) {
      const priority = upgradePriority[job.upgradeOption] ?? upgradePriority.null;
      if (!groupMap.has(priority)) groupMap.set(priority, []);
      groupMap.get(priority).push(job);
    }

    const sortedJobs = Array.from(groupMap.entries())
      .sort(([a], [b]) => a - b)
      .flatMap(([_, jobs]) =>
        jobs.sort(() => Math.random() - 0.5) // fast shuffle
      );

    const uniqueSellerIds = [...new Set(sortedJobs.map(job => job.sellerId).filter(Boolean))];
    
    let badgeMap = new Map();
    if (uniqueSellerIds.length > 0) {
      try {
        const badges = await SellerBadge.find({ 
          userId: { $in: uniqueSellerIds } 
        }).select('userId currentLevel trustScore searchBoost isVerified').lean();
        
        badges.forEach(badge => {
          badgeMap.set(badge.userId.toString(), {
            level: badge.currentLevel || 'new',
            trustScore: badge.trustScore || 0,
            searchBoost: badge.searchBoost || 1.0,
            isVerified: badge.isVerified || false
          });
        });
      } catch (badgeErr) {
        console.error("Error fetching seller badges:", badgeErr);
      }
    }

    const boostedSortedJobs = sortedJobs.sort((a, b) => {
      const priorityA = a.upgradeOption === "top" ? 1 : a.upgradeOption === "highlighted" ? 2 : 3;
      const priorityB = b.upgradeOption === "top" ? 1 : b.upgradeOption === "highlighted" ? 2 : 3;
      
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      const badgeA = badgeMap.get(a.sellerId?.toString()) || { searchBoost: 1.0 };
      const badgeB = badgeMap.get(b.sellerId?.toString()) || { searchBoost: 1.0 };
      
      return (badgeB.searchBoost || 1.0) - (badgeA.searchBoost || 1.0);
    });

    const sellerMap = new Map();
    if (uniqueSellerIds.length > 0) {
      try {
        const [sellers, profiles] = await Promise.all([
          User.find({ _id: { $in: uniqueSellerIds } }).select('username fullName').lean(),
          UserProfile.find({ userId: { $in: uniqueSellerIds } }).select('userId profilePicture').lean()
        ]);
        
        const profileMap = new Map();
        profiles.forEach(p => profileMap.set(p.userId.toString(), p.profilePicture));

        sellers.forEach(seller => {
          sellerMap.set(seller._id.toString(), {
            username: seller.username || seller.fullName || 'Unknown',
            profilePicture: profileMap.get(seller._id.toString()) || '/default-avatar.png'
          });
        });
      } catch (sellerErr) {
        console.error("Error fetching seller info:", sellerErr);
      }
    }

    const response = boostedSortedJobs.map(job => {
      const sellerBadge = badgeMap.get(job.sellerId?.toString()) || null;
      const sellerInfo = sellerMap.get(job.sellerId?.toString()) || { username: 'Unknown', profilePicture: '/default-avatar.png' };
      
      return {
        _id: job._id,
        title: job.title,
        cat: job.cat,
        subCat: job.subCat,
        upgradeOption: job.upgradeOption,
        premiumPlan: job.pricingPlan?.premium || null,
        pricingPlan: job.pricingPlan || null,
        image: job.photos?.[0] || null,
        photos: job.photos || [],
        sales: job.sales || 0,
        sellerId: job.sellerId,
        jobStatus: job.jobStatus,
        totalStars: job.totalStars || 0,
        starNumber: job.starNumber || 0,
        reviews: job.starNumber || 0,
        rating: job.starNumber > 0
          ? +(job.totalStars / job.starNumber).toFixed(1)
          : 0,
        seller: {
          username: sellerInfo.username,
          profilePicture: sellerInfo.profilePicture
        },
        sellerBadge: sellerBadge ? {
          level: sellerBadge.level,
          trustScore: sellerBadge.trustScore,
          isVerified: sellerBadge.isVerified
        } : null
      };
    });

    return res.status(200).json(response);
  } catch (err) {
    console.error("getAllJobs error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const applyDiscountToGig = async (req, res) => {
  try {
      const { userId } = req; 
      const { discount, gigId } = req.body; 

      if (!userId) {
          return res.status(401).json({ message: "User is not authenticated!" });
      }

      if (discount < 0 || discount > 100) {
          return res.status(400).json({ message: "Discount must be between 0 and 100." });
      }

      const gig = await Job.findById(gigId);

      if (!gig) {
          return res.status(404).json({ message: "Gig not found." });
      }

      if (gig.sellerId !== userId.toString()) {
          return res.status(403).json({ message: "You are not authorized to modify this gig." });
      }

      gig.discount = discount;
      await gig.save();

      res.status(200).json({
          message: "Discount applied successfully.",
          gig
      });
  } catch (error) {
      console.error("Error applying discount:", error);
      res.status(500).json({ message: "Internal server error." });
  }
};

const getUserJobs = async (req, res) => {
  try {
    const { userId } = req;

    console.log('[getUserJobs] Request from userId:', userId);

    if (!userId) {
      console.log('[getUserJobs] No userId provided');
      return res.status(400).json({ message: "User ID is required" });
    }

    const userIdString = userId.toString();
    const mongoose = require('mongoose');
    const userIdObjectId = mongoose.Types.ObjectId.isValid(userIdString) 
      ? new mongoose.Types.ObjectId(userIdString) 
      : null;

    console.log('[getUserJobs] Searching for sellerId:', userIdString);
    
    let jobs = await Job.find({ 
      $or: [
        { sellerId: userIdString },
        ...(userIdObjectId ? [{ sellerId: userIdObjectId }] : [])
      ]
    });
    
    console.log('[getUserJobs] Found', jobs?.length || 0, 'jobs for user:', userIdString);

    const { applyPromotionPriorities } = require('../utils/gigVisibility');
    jobs = await applyPromotionPriorities(jobs);

    res.status(200).json(jobs || []);
  } catch (error) {
    console.error("[getUserJobs] Error fetching user jobs:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const convertJobPricesToEur = (jobs, rate) => {
      const convertPrice = (price) => rate ? price * rate : price;
    
      return jobs.map(job => {
        if (rate) {
          job.pricingPlan.basic.price = convertPrice(job.pricingPlan.basic.price);
          job.pricingPlan.premium.price = convertPrice(job.pricingPlan.premium.price);
          job.pricingPlan.pro.price = convertPrice(job.pricingPlan.pro.price);
    
          if (job.addons && job.addons.extraService) {
            job.addons.extraService = convertPrice(job.addons.extraService);
          }
        }
        return job;
      });
    };











const getFeaturedJobs = async (req, res) => {
  try {
    const { lang, limit = 12 } = req.query;
    const { sortGigsByPromotion } = require('../utils/gigVisibility');

    const allJobs = await Job.find({ 
      jobStatus: { $in: ['Available', 'active', 'Active'] }
    }).limit(parseInt(limit) * 2).lean(); // Fetch more to sort and limit

    if (!allJobs || allJobs.length === 0) {
      return res.status(200).json([]); // Return empty array if no gigs
    }

    const sortedByPromotion = await sortGigsByPromotion(allJobs);
    const sortedJobs = sortedByPromotion.slice(0, parseInt(limit));

    const uniqueSellerIds = [...new Set(sortedJobs.map(job => job.sellerId).filter(Boolean))];
    let badgeMap = new Map();
    let sellerMap = new Map();
    
    if (uniqueSellerIds.length > 0) {
      try {
        const badges = await SellerBadge.find({ 
          userId: { $in: uniqueSellerIds } 
        }).select('userId currentLevel trustScore isVerified').lean();
        
        badges.forEach(badge => {
          badgeMap.set(badge.userId.toString(), {
            level: badge.currentLevel || 'new',
            trustScore: badge.trustScore || 0,
            isVerified: badge.isVerified || false
          });
        });

        const [sellers, profiles] = await Promise.all([
          User.find({ _id: { $in: uniqueSellerIds } }).select('username fullName').lean(),
          UserProfile.find({ userId: { $in: uniqueSellerIds } }).select('userId profilePicture').lean()
        ]);
        
        const profileMap = new Map();
        profiles.forEach(p => profileMap.set(p.userId.toString(), p.profilePicture));

        sellers.forEach(seller => {
          sellerMap.set(seller._id.toString(), {
            username: seller.username || seller.fullName || 'Unknown',
            profilePicture: profileMap.get(seller._id.toString()) || '/default-avatar.png'
          });
        });
      } catch (err) {
        console.error("Error fetching seller data for featured jobs:", err);
      }
    }

    const europeanCountryCodes = [
      "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CY", "CZ",
      "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IE", "IT",
      "XK", "LV", "LI", "LT", "LU", "MT", "MD", "MC", "ME", "NL",
      "MK", "NO", "PL", "PT", "RO", "SM", "RS", "SK", "SI", "ES",
      "SE", "CH", "UA", "GB", "VA"
    ];

    const {countryCode, country} = await getCountryInfo(req);

    let rate = null;
    let convertedJobs = sortedJobs;

    if (europeanCountryCodes.includes(countryCode)) {
      rate = await getUsdToEurRate();
      convertedJobs = convertJobPricesToEur(sortedJobs, rate);
    }

    convertedJobs = applyDiscountUtil(convertedJobs);

    if (lang && lang !== "en") {
      convertedJobs = await Promise.all(
        convertedJobs.map((job) => translateJob(job, lang))
      );
    }

    const gigIds = sortedJobs.map(job => job._id.toString());
    
    const Order = require('../models/Order');
    const salesCounts = await Order.aggregate([
      { 
        $match: { 
          gigId: { $in: gigIds },
          status: { $in: ['completed', 'delivered'] }
        } 
      },
      { $group: { _id: '$gigId', count: { $sum: 1 } } }
    ]);
    const salesMap = new Map(salesCounts.map(s => [s._id, s.count]));
    
    const reviewsCounts = await Reviews.aggregate([
      { $match: { gigId: { $in: gigIds } } },
      { $group: { _id: '$gigId', count: { $sum: 1 } } }
    ]);
    const reviewsMap = new Map(reviewsCounts.map(r => [r._id, r.count]));

    const jobsWithExtras = convertedJobs.map(job => {
      const sellerBadge = badgeMap.get(job.sellerId?.toString()) || null;
      const sellerInfo = sellerMap.get(job.sellerId?.toString()) || { username: 'Unknown', profilePicture: '/default-avatar.png' };
      const reviewsCount = reviewsMap.get(job._id.toString()) || 0;
      const salesCount = salesMap.get(job._id.toString()) || 0;
      
      return {
        ...job,
        reviews: reviewsCount,
        sales: salesCount,
        seller: {
          username: sellerInfo.username,
          profilePicture: sellerInfo.profilePicture
        },
        sellerBadge: sellerBadge
      };
    });
      
    return res.status(200).json(jobsWithExtras);
  } catch (error) {
    console.error("Error fetching featured jobs:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    const { userId } = req;

    if (!userId) {
      return res.status(400).send("User is not verified");
    }

    const gig = await Job.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ message: "No gig found" });
    }

    if (gig.sellerId !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your gig" });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      success: true, 
      code: 'GIG_DELETED', 
      message: "Gig has been deleted" 
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid Job ID" });
    }
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};








const getGigDetails = async (gigId, lang = 'en') => {
  try {
    const gig = await Job.findById(gigId).lean();
    if (!gig) return { error: "Gig not found" };

    const seller = await User.findById(gig.sellerId).lean();
    const userProfile = await UserProfile.findOne({
      userId: seller?._id?.toString(),
    }).lean();

    const reviews = await Reviews.find({ gigId }).lean();

    let translatedGig = gig;
    let translatedReviews = reviews;

    if (lang !== 'en') {
      const translationPayload = {
        title: gig.title,
        cat: gig.cat,
        subCat: gig.subCat,
        description: gig.description,
        keywords: gig.keywords,
        whyChooseMe: gig.whyChooseMe,
        pricingPlan: {
          basic: {
            title: gig.pricingPlan?.basic?.title,
            description: gig.pricingPlan?.basic?.description,
          },
          premium: {
            title: gig.pricingPlan?.premium?.title,
            description: gig.pricingPlan?.premium?.description,
          },
          pro: {
            title: gig.pricingPlan?.pro?.title,
            description: gig.pricingPlan?.pro?.description,
          },
        },
        addons: {
          title: gig.addons?.title,
        },
        faqs: (gig.faqs || []).map(faq => ({
          question: faq.question,
          answer: faq.answer,
        })),
      };

      const translatedContent = await translateJSON(translationPayload, lang); 

      translatedGig = {
        ...gig,
        ...translatedContent,
        pricingPlan: {
          basic: {
            ...gig.pricingPlan?.basic,
            title: translatedContent.pricingPlan?.basic?.title || gig.pricingPlan?.basic?.title,
            description: translatedContent.pricingPlan?.basic?.description || gig.pricingPlan?.basic?.description,
          },
          premium: {
            ...gig.pricingPlan?.premium,
            title: translatedContent.pricingPlan?.premium?.title || gig.pricingPlan?.premium?.title,
            description: translatedContent.pricingPlan?.premium?.description || gig.pricingPlan?.premium?.description,
          },
          pro: {
            ...gig.pricingPlan?.pro,
            title: translatedContent.pricingPlan?.pro?.title || gig.pricingPlan?.pro?.title,
            description: translatedContent.pricingPlan?.pro?.description || gig.pricingPlan?.pro?.description,
          },
        },
        addons: {
          ...gig.addons,
          ...translatedContent.addons,
        },
        faqs: gig.faqs?.map((faq, i) => ({
          ...faq,
          ...translatedContent.faqs?.[i],
        })) || [],
      };

      const reviewTexts = reviews.map(r => r.desc || '');
      const translatedReviewTexts = await translateText(reviewTexts, lang); 

      translatedReviews = reviews.map((r, i) => ({
        ...r,
        desc: translatedReviewTexts[i] || r.desc,
      }));
    }

    const reviewsWithUserDetails = await Promise.all(
      translatedReviews.map(async (review) => {
        const user = await User.findById(review.userId).lean();
        const userProfile = await UserProfile.findOne({ userId: review.userId }).lean();

        return {
          ...review,
          desc: review.desc,
          user: {
            fullName: user?.fullName || review.reviewerName || "Anonymous",
            username: user?.username || review.reviewerName || "Anonymous",
            profilePicture: userProfile?.profilePicture || review.reviewerImage || "/default-avatar.png",
          },
        };
      })
    );

    const totalStars = reviews.reduce((sum, review) => sum + (review.star || 0), 0);
    const averageRating = reviews.length > 0 ? (totalStars / reviews.length).toFixed(2) : 0;

    let sellerLevel = null;
    let sellerBadge = null;
    let sellerStats = null;
    if (gig.sellerId) {
      try {
        sellerStats = await getSellerStatistics(gig.sellerId);
        sellerLevel = sellerStats?.sellerLevel || null;
        
        const badge = await SellerBadge.findOne({ userId: gig.sellerId })
          .select('currentLevel trustScore searchBoost isVerified achievements')
          .lean();
        
        if (badge) {
          sellerBadge = {
            level: badge.currentLevel || 'new',
            trustScore: badge.trustScore || 0,
            isVerified: badge.isVerified || false,
            achievements: badge.achievements || []
          };
        }
      } catch (err) {
        console.error("Error getting seller level/badge:", err);
      }
    }

    return {
      gig: translatedGig,
      seller: {
        fullName: seller?.fullName || "Unknown Seller",
        userName: seller?.username,
        userId: seller?._id,
        profilePicture: userProfile?.profilePicture || "/default-avatar.png",
        sellerLevel: sellerLevel,
        badge: sellerBadge,
        successScore: sellerStats?.successScore ?? null,
        completionRate: sellerStats?.completionRate ?? null,
      },
      reviews: reviewsWithUserDetails,
      averageRating,
    };
  } catch (error) {
    console.error("Error in getGigDetails:", error);
    return { error: "An unexpected error occurred" };
  }
};

const getGigDetailsController = async (req, res) => {
  const { id } = req.params;

  const { lang } = req.query;

  const gigDetails = await getGigDetails(id, lang);

  if (gigDetails.error) {
    return res.status(404).json({ message: gigDetails.error });
  }

  res.status(200).json(gigDetails);
};

const editJob = async (req, res) => {
  const { userId } = req;

  if (!userId) {
    return res.status(401).json({ message: "You are not logged in!" });
  }

  try {
    const { jobId } = req.params; // Get job ID from URL
    const updateFields = req.body; // Allow partial updates

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found!" });
    }

    if (job.sellerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized! You can only edit your own gigs." });
    }

    const user = await User.findById(userId);
    if (!user.isSeller) {
      return res.status(403).json({ message: "You are not allowed to edit gigs!" });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { $set: updateFields }, 
      { new: true } 
    );

    res.status(200).json({ 
      success: true, 
      code: 'GIG_UPDATED', 
      message: "Job updated successfully!", 
      data: updatedJob 
    });
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = {
  createJob,
  editJob,
  getAllJobs,
  getUserJobs,
  getFeaturedJobs,
  getGigDetailsController,
  deleteJob,applyDiscountToGig
};
