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

    // 🧠 Parse stringified fields from FormData
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

    // Ensure jobStatus is set to Active if not provided
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

// const getAllJobs = async (req, res) => {
//   try {
//     const q = req.query;
//     const targetLang = q.lang || 'en'; 

//     const parsedCategories = q.categories
//       ? q.categories.split(',').map((entry) => {
//           const [category, subCat] = entry.split('›').map(s => s.trim());
//           return { category, subCat };
//         })
//       : [];

//     const filters = {
//       ...(q.min && { "pricingPlan.basic.price": { $gte: parseFloat(q.min) } }),
//       ...(q.max && { "pricingPlan.pro.price": { $lte: parseFloat(q.max) } }),
//       ...(q.keywords && {
//         keywords: {
//           $in: q.keywords.split(',').map(k => new RegExp(k, 'i')),
//         },
//       }),
//       ...(q.deliveryTime && {
//         "pricingPlan.basic.deliveryTime": {
//           $lte: {
//             "24 hours": 1,
//             "1 day": 1,
//             "up to 3 days": 3,
//             "up to 1 week": 7,
//             "up to 1 month": 30,
//             Anytime: Infinity,
//           }[q.deliveryTime] || Infinity,
//         },
//       }),
//       ...(q.sold && { sold: q.sold === "true" }),
//       ...(q.search && {
//         $or: [
//           { title: { $regex: q.search, $options: "i" } },
//           { description: { $regex: q.search, $options: "i" } },
//         ],
//       }),
//     };

//     // Add category/subCat filters using $or
//     if (parsedCategories.length) {
//       filters.$or = parsedCategories.map(({ category, subCat }) => ({
//         category: { $regex: new RegExp(category, 'i') },
//         subCat: { $regex: new RegExp(subCat, 'i') },
//       }));
//     }

//     const jobs = await Job.find(Object.keys(filters).length ? filters : {});

//     if (!jobs.length) {
//       return res.status(404).json({ message: "No jobs found" });
//     }

// if (targetLang !== 'en') {
//   const titles = [], descriptions = [], cats = [], subCats = [], whyChooseMes = [];
//   const pricingTitles = [], pricingDescriptions = [], pricingMap = [];
//   const faqQuestions = [], faqAnswers = [], faqMap = [];
//   const addonTitles = [], addonMap = [];

//   jobs.forEach((job, idx) => {
//     titles.push(job.title || '');
//     descriptions.push(job.description || '');
//     cats.push(job.cat || '');
//     subCats.push(job.subCat || '');
//     whyChooseMes.push(job.whyChooseMe || '');

//     // pricingPlan titles/descriptions
//     ['basic', 'premium', 'pro'].forEach(plan => {
//       if (job.pricingPlan?.[plan]) {
//         pricingTitles.push(job.pricingPlan[plan].title || '');
//         pricingDescriptions.push(job.pricingPlan[plan].description || '');
//         pricingMap.push({ idx, plan });
//       }
//     });

//     // addons title
//     if (job.addons?.title) {
//       addonTitles.push(job.addons.title);
//       addonMap.push(idx);
//     }

//     // FAQs
//     if (Array.isArray(job.faqs)) {
//       job.faqs.forEach((faq, faqIdx) => {
//         faqQuestions.push(faq.question || '');
//         faqAnswers.push(faq.answer || '');
//         faqMap.push({ jobIdx: idx, faqIdx });
//       });
//     }
//   });

//   const [
//     translatedTitles,
//     translatedDescriptions,
//     translatedCats,
//     translatedSubCats,
//     translatedWhyChooseMes,
//     translatedPricingTitles,
//     translatedPricingDescriptions,
//     translatedFaqQuestions,
//     translatedFaqAnswers,
//     translatedAddonTitles
//   ] = await Promise.all([
//     translateText(titles, targetLang),
//     translateText(descriptions, targetLang),
//     translateText(cats, targetLang),
//     translateText(subCats, targetLang),
//     translateText(whyChooseMes, targetLang),
//     translateText(pricingTitles, targetLang),
//     translateText(pricingDescriptions, targetLang),
//     translateText(faqQuestions, targetLang),
//     translateText(faqAnswers, targetLang),
//     translateText(addonTitles, targetLang),
//   ]);

//   jobs.forEach((job, idx) => {
//     job.title = translatedTitles[idx];
//     job.description = translatedDescriptions[idx];
//     job.cat = translatedCats[idx];
//     job.subCat = translatedSubCats[idx];
//     job.whyChooseMe = translatedWhyChooseMes[idx];
//   });

//   pricingMap.forEach((mapItem, i) => {
//     const job = jobs[mapItem.idx];
//     if (job?.pricingPlan?.[mapItem.plan]) {
//       job.pricingPlan[mapItem.plan].title = translatedPricingTitles[i];
//       job.pricingPlan[mapItem.plan].description = translatedPricingDescriptions[i];
//     }
//   });

//   addonMap.forEach((jobIdx, i) => {
//     if (jobs[jobIdx]?.addons) {
//       jobs[jobIdx].addons.title = translatedAddonTitles[i];
//     }
//   });

//   faqMap.forEach((mapItem, i) => {
//     const job = jobs[mapItem.jobIdx];
//     if (job?.faqs?.[mapItem.faqIdx]) {
//       job.faqs[mapItem.faqIdx].question = translatedFaqQuestions[i];
//       job.faqs[mapItem.faqIdx].answer = translatedFaqAnswers[i];
//     }
//   });
// }

//     const upgradePriority = {
//       homepage: 1,
//       premium: 2,
//       sponsored: 3,
//       standard: 4,
//       basic: 5,
//       featured: 6,
//       free: 7,
//       null: 8,
//       undefined: 9,
//     };

//     const shuffleArray = (arr) => {
//       return arr
//         .map((item) => ({ item, sort: Math.random() }))
//         .sort((a, b) => a.sort - b.sort)
//         .map(({ item }) => item);
//     };

//     const jobsGroupedByPriority = {};

//     for (const job of jobs) {
//       const priority = upgradePriority[job.upgradeOption] || upgradePriority.null;
//       if (!jobsGroupedByPriority[priority]) {
//         jobsGroupedByPriority[priority] = [];
//       }
//       jobsGroupedByPriority[priority].push(job);
//     }

//     const sortedJobs = Object.keys(jobsGroupedByPriority)
//       .sort((a, b) => parseInt(a) - parseInt(b))
//       .flatMap(priority => {
//         const group = jobsGroupedByPriority[priority];
//         return shuffleArray(group);
//       });

//     res.status(200).json(sortedJobs);
//   } catch (error) {
//     console.error("Error fetching jobs:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

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

    // ----------- Build Filters -------------
    const filters = {};
    
    // By default, only show available/active jobs
    if (showAll !== "true") {
      filters.jobStatus = { $in: ['Available', 'active', 'Active'] };
    }

    // Price filter - check the basic plan price (or any plan price)
    if (min || max) {
      const priceFilter = {};
      if (min) priceFilter.$gte = parseFloat(min);
      if (max) priceFilter.$lte = parseFloat(max);
      
      // Filter on basic plan price as the starting price
      filters["pricingPlan.basic.price"] = priceFilter;
    }

    if (keywords) {
      const keywordRegexes = keywords.split(',').map(k => new RegExp(k.trim(), 'i'));
      filters.keywords = { $in: keywordRegexes };
    }

    if (deliveryTime) {
      // Handle both numeric values and string values for delivery time
      const numericDeliveryTime = parseInt(deliveryTime);
      
      if (!isNaN(numericDeliveryTime)) {
        // If numeric value is passed (from frontend filter)
        filters["pricingPlan.basic.deliveryTime"] = {
          $lte: numericDeliveryTime,
        };
      } else {
        // Legacy string format support
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

    // escape regex characters
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
          // Has both category and subcategory
          return {
            $and: [
              { cat: { $regex: new RegExp(escapeRegex(parts[0]), 'i') } },
              { subCat: { $regex: new RegExp(escapeRegex(parts[1]), 'i') } }
            ]
          };
        } else {
          // Just category name
          return { cat: { $regex: new RegExp(escapeRegex(parts[0]), 'i') } };
        }
      });
      
      // Combine with existing $or or create new one
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

    // ----------- Projection -------------
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

    // ----------- Optional Translation -------------
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

    // ----------- Group + Shuffle + Sort -------------
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

    // ----------- Fetch Seller Badges -------------
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
        // Continue without badges if there's an error
      }
    }

    // ----------- Apply Search Boost Sorting -------------
    // Re-sort within each upgrade priority group by search boost
    const boostedSortedJobs = sortedJobs.sort((a, b) => {
      // First maintain upgrade priority
      const priorityA = a.upgradeOption === "top" ? 1 : a.upgradeOption === "highlighted" ? 2 : 3;
      const priorityB = b.upgradeOption === "top" ? 1 : b.upgradeOption === "highlighted" ? 2 : 3;
      
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      // Within same priority, sort by search boost
      const badgeA = badgeMap.get(a.sellerId?.toString()) || { searchBoost: 1.0 };
      const badgeB = badgeMap.get(b.sellerId?.toString()) || { searchBoost: 1.0 };
      
      return (badgeB.searchBoost || 1.0) - (badgeA.searchBoost || 1.0);
    });

    // ----------- Fetch Seller Information -------------
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

    // ----------- Build Final Response -------------
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
    console.log('[getUserJobs] Searching for sellerId:', userIdString);
    
    let jobs = await Job.find({ sellerId: userIdString });
    
    console.log('[getUserJobs] Found', jobs?.length || 0, 'jobs for user:', userIdString);

    // Apply promotion priorities
    const { applyPromotionPriorities } = require('../utils/gigVisibility');
    jobs = await applyPromotionPriorities(jobs);

    // Return empty array instead of 404 to allow frontend to handle gracefully
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

// const getFeaturedJobs = async (req, res) => {
//   try {
//     const jobs = await Job.find({ upgradeOption: "Feature listing" }); // Adjust query field if necessary

//     if (!jobs || jobs.length === 0) {
//       return res.status(404).json({ message: "No jobs found" });
//     }

//     res.status(200).json(jobs);
//   } catch (error) {
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

// const getFeaturedJobs = async (req, res) => {
//   try {
//     const { lang } = req.query;

//     const jobs = await Job.find({ upgradeOption: "Feature listing" });

//     if (!jobs || jobs.length === 0) {
//       return res.status(404).json({ message: "No jobs found" });
//     }

//     if (lang) {
//       const translatedJobs = await Promise.all(
//         jobs.map(async (job) => {
//           const translatedJob = {
//             ...job._doc,
//             title: await translateText(job.title, "en", lang),
//             description: await translateText(job.description, "en", lang),
//             pricingPlan: {
//               basic: {
//                 title: await translateText(job.pricingPlan.basic.title, "en", lang),
//                 description: await translateText(job.pricingPlan.basic.description, "en", lang),
//               },
//               premium: {
//                 title: await translateText(job.pricingPlan.premium.title, "en", lang),
//                 description: await translateText(job.pricingPlan.premium.description, "en", lang),
//               },
//               pro: {
//                 title: await translateText(job.pricingPlan.pro.title, "en", lang),
//                 description: await translateText(job.pricingPlan.pro.description, "en", lang),
//               }
//             },
//             addons: {
//               title: await translateText(job.addons.title, "en", lang),
//             },
//             faqs: await Promise.all(
//               job.faqs.map(async (faq) => ({
//                 question: await translateText(faq.question, "en", lang),
//                 answer: await translateText(faq.answer, "en", lang),
//               }))
//             ),
//             whyChooseMe: await translateText(job.whyChooseMe, "en", lang),
//           };
//           return translatedJob;
//         })
//       );

//       return res.status(200).json(translatedJobs);
//     }

//     return res.status(200).json(jobs);

//   } catch (error) {
//     console.error("Error fetching featured jobs:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

const getFeaturedJobs = async (req, res) => {
  try {
    const { lang, limit = 12 } = req.query;
    const { sortGigsByPromotion } = require('../utils/gigVisibility');

    // Show ALL active gigs, will be sorted by promotion level
    const allJobs = await Job.find({ 
      jobStatus: { $in: ['Available', 'active', 'Active'] }
    }).limit(parseInt(limit) * 2).lean(); // Fetch more to sort and limit

    if (!allJobs || allJobs.length === 0) {
      return res.status(200).json([]); // Return empty array if no gigs
    }

    // Apply promotion-based sorting using the gigVisibility utility
    const sortedByPromotion = await sortGigsByPromotion(allJobs);
    const sortedJobs = sortedByPromotion.slice(0, parseInt(limit));

    // Fetch seller badges and seller info
    const uniqueSellerIds = [...new Set(sortedJobs.map(job => job.sellerId).filter(Boolean))];
    let badgeMap = new Map();
    let sellerMap = new Map();
    
    if (uniqueSellerIds.length > 0) {
      try {
        // Fetch badges
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

        // Fetch seller info
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

    // Fetch reviews count for each gig
    const gigIds = sortedJobs.map(job => job._id.toString());
    
    // Aggregate sales count from completed orders
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

    // Add seller badge and seller info to each job
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

// Function to get gig details, seller info, and reviews
// const getGigDetails = async (gigId) => {
//   try {
//     // Fetch the gig details using gigId
//     const gig = await Job.findById(gigId);
//     if (!gig) {
//       return { error: "Gig not found" }; // Return meaningful message
//     }

//     // Fetch the seller's user profile using the sellerId from the gig
//     const seller = await User.findById(gig.sellerId) || { fullName: "Unknown Seller", _id: null };

//     // Fetch the seller's profile picture and full name using the sellerId
//     const userProfile = await UserProfile.findOne({ userId: seller._id?.toString() }) || { profilePicture: "/default-avatar.png" };

//     // Fetch all reviews for this gig using gigId
//     const reviews = await Reviews.find({ gigId: gigId }) || []; // Empty array if no reviews

//     // Calculate the average rating (out of 5) from the reviews
//     const totalStars = reviews.reduce((sum, review) => sum + review.star, 0);
//     const averageRating = reviews.length > 0 ? (totalStars / reviews.length).toFixed(2) : "N/A";

//     // Structure the data to be returned
//     const gigDetails = {
//       gig: gig,
//       seller: {
//         fullName: seller.fullName || "Unknown Seller",
//         userId: seller._id,
//         profilePicture: userProfile.profilePicture,
//       },
//       reviews: reviews,
//       averageRating: averageRating, // rounded to 2 decimal places
//     };

//     return gigDetails;
//   } catch (error) {
//     console.error(error.message);
//     return { error: "An unexpected error occurred" }; // General error response
//   }
// };

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

    // Only translate if language is not English
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
            username: user?.username || review.reviewerName || "Anonymous",
            profilePicture: userProfile?.profilePicture || review.reviewerImage || "/default-avatar.png",
          },
        };
      })
    );

    const totalStars = reviews.reduce((sum, review) => sum + (review.star || 0), 0);
    const averageRating = reviews.length > 0 ? (totalStars / reviews.length).toFixed(2) : 0;

    // Get seller level based on performance metrics
    let sellerLevel = null;
    let sellerBadge = null;
    let sellerStats = null;
    if (gig.sellerId) {
      try {
        sellerStats = await getSellerStatistics(gig.sellerId);
        sellerLevel = sellerStats?.sellerLevel || null;
        
        // Fetch seller badge info
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

    // Check if the job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found!" });
    }

    // Ensure the user is the owner of the job
    if (job.sellerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized! You can only edit your own gigs." });
    }

    // Ensure the user is a seller
    const user = await User.findById(userId);
    if (!user.isSeller) {
      return res.status(403).json({ message: "You are not allowed to edit gigs!" });
    }

    // Update the job
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
