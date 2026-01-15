const axios = require("axios");

const SUPPORTED_PAIRS = new Set([
  'en|es', 'es|en', 'en|ca', 'ca|en', 'en|gl', 'gl|en',
  'es|ca', 'ca|es', 'es|gl', 'gl|es', 'es|pt', 'pt|es',
  'en|fr', 'fr|en', 'fr|es', 'es|fr', 'fr|ca', 'ca|fr',
  'en|eo', 'eo|en', 'es|eo', 'eo|es',
]);

const isLanguagePairSupported = (sourceLang, targetLang) => {
  return SUPPORTED_PAIRS.has(`${sourceLang}|${targetLang}`);
};

const translateText = async (text, sourceLang, targetLang) => {
  if (!text || text.trim() === '' || sourceLang === targetLang) {
    return text;
  }

  if (!isLanguagePairSupported(sourceLang, targetLang)) {
    return text;
  }

  try {
    const response = await axios.get(
      `https://apertium.org/apy/translate?langpair=${sourceLang}|${targetLang}&q=${encodeURIComponent(text)}`,
      { timeout: 5000 } // 5 second timeout
    );
    
    if (response.data?.responseData?.translatedText) {
      return response.data.responseData.translatedText;
    }
    
    return text;
  } catch (error) {
    if (error.response?.status === 400) {
      return text;
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return text;
    }
    console.error("Translation service error:", error.message);
    return text; 
  }
};

const translateJob = async (job, lang) => {
  if (!job || lang === 'en') {
    return job;
  }

  if (!isLanguagePairSupported('en', lang)) {
    return job._doc ? job._doc : job;
  }

  try {
    const jobDoc = job._doc || job;
    
    const [title, description, whyChooseMe] = await Promise.all([
      translateText(jobDoc.title, "en", lang),
      translateText(jobDoc.description, "en", lang),
      translateText(jobDoc.whyChooseMe, "en", lang),
    ]);

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

    const addons = jobDoc.addons ? {
      ...jobDoc.addons,
      title: await translateText(jobDoc.addons.title, "en", lang),
    } : jobDoc.addons;

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
    return job._doc ? job._doc : job;
  }
};

const translateReviews = async (reviews, lang) => {
  if (!reviews || !reviews.length || lang === 'en') {
    return reviews;
  }

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