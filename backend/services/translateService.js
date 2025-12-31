const axios = require("axios");

// Supported language pairs for Apertium (source|target)
const SUPPORTED_PAIRS = new Set([
  'en|es', 'es|en', 'en|ca', 'ca|en', 'en|gl', 'gl|en',
  'es|ca', 'ca|es', 'es|gl', 'gl|es', 'es|pt', 'pt|es',
  'en|fr', 'fr|en', 'fr|es', 'es|fr', 'fr|ca', 'ca|fr',
  'en|eo', 'eo|en', 'es|eo', 'eo|es',
]);

// Check if a language pair is supported
const isLanguagePairSupported = (sourceLang, targetLang) => {
  return SUPPORTED_PAIRS.has(`${sourceLang}|${targetLang}`);
};

const translateText = async (text, sourceLang, targetLang) => {
  // Return original text if empty or same language
  if (!text || text.trim() === '' || sourceLang === targetLang) {
    return text;
  }

  // Check if language pair is supported
  if (!isLanguagePairSupported(sourceLang, targetLang)) {
    // Silently return original text for unsupported pairs
    return text;
  }

  try {
    const response = await axios.get(
      `https://apertium.org/apy/translate?langpair=${sourceLang}|${targetLang}&q=${encodeURIComponent(text)}`,
      { timeout: 5000 } // 5 second timeout
    );
    
    // Check for valid response
    if (response.data?.responseData?.translatedText) {
      return response.data.responseData.translatedText;
    }
    
    // If response structure is unexpected, return original
    return text;
  } catch (error) {
    // Handle specific error cases silently
    if (error.response?.status === 400) {
      // Unsupported language pair - return original text
      return text;
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      // Timeout - return original text
      return text;
    }
    // Log other errors but still return original text
    console.error("Translation service error:", error.message);
    return text; 
  }
};


const translateJob = async (job, lang) => {
  // Skip translation if language is English or job is invalid
  if (!job || lang === 'en') {
    return job;
  }

  // Check if language pair is supported before attempting translation
  if (!isLanguagePairSupported('en', lang)) {
    // Return original job for unsupported languages
    return job._doc ? job._doc : job;
  }

  try {
    const jobDoc = job._doc || job;
    
    // Translate fields in parallel for better performance
    const [title, description, whyChooseMe] = await Promise.all([
      translateText(jobDoc.title, "en", lang),
      translateText(jobDoc.description, "en", lang),
      translateText(jobDoc.whyChooseMe, "en", lang),
    ]);

    // Translate pricing plan titles and descriptions
    const pricingPlan = {};
    if (jobDoc.pricingPlan) {
      const plans = ['basic', 'premium', 'pro'];
      for (const plan of plans) {
        if (jobDoc.pricingPlan[plan]) {
          const [planTitle, planDesc] = await Promise.all([
            translateText(jobDoc.pricingPlan[plan].title, "en", lang),
            translateText(jobDoc.pricingPlan[plan].description, "en", lang),
          ]);
          pricingPlan[plan] = {
            ...jobDoc.pricingPlan[plan],
            title: planTitle,
            description: planDesc,
          };
        }
      }
    }

    // Translate addons
    const addons = jobDoc.addons ? {
      ...jobDoc.addons,
      title: await translateText(jobDoc.addons.title, "en", lang),
    } : jobDoc.addons;

    // Translate FAQs
    const faqs = jobDoc.faqs ? await Promise.all(
      jobDoc.faqs.map(async (faq) => ({
        ...faq,
        question: await translateText(faq.question, "en", lang),
        answer: await translateText(faq.answer, "en", lang),
      }))
    ) : [];

    return {
      ...jobDoc,
      title,
      description,
      whyChooseMe,
      pricingPlan: { ...jobDoc.pricingPlan, ...pricingPlan },
      addons,
      faqs,
    };
  } catch (error) {
    console.error("Error translating job:", error.message);
    // Return original job on any error
    return job._doc ? job._doc : job;
  }
};

const translateReviews = async (reviews, lang) => {
  // Skip translation if language is English or no reviews
  if (!reviews || !reviews.length || lang === 'en') {
    return reviews;
  }

  // Check if language pair is supported
  if (!isLanguagePairSupported('en', lang)) {
    return reviews;
  }

  try {
    return await Promise.all(
      reviews.map(async (review) => ({
        ...review,
        desc: await translateText(review.desc, 'en', lang),
      }))
    );
  } catch (error) {
    console.error("Error during reviews translation:", error.message);
    return reviews; // Return the original reviews if translation fails
  }
};

module.exports = {
  translateJob,
  translateReviews,
  translateText,
  isLanguagePairSupported,
};