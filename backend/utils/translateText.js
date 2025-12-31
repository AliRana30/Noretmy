const axios = require('axios');

const translateText = async (texts, toLang) => {
  if (!texts.length) return [];

  try {
    const response = await axios({
      method: 'POST',
      baseURL: 'https://api.cognitive.microsofttranslator.com',
      url: '/translate',
      params: {
        'api-version': '3.0',
        to: toLang,
      },
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.MS_TRANSLATOR_KEY,
        'Ocp-Apim-Subscription-Region': process.env.MS_TRANSLATOR_REGION,
        'Content-type': 'application/json',
      },
      data: texts.map(text => ({ Text: text })),
    });

    return response.data.map(item => item.translations[0].text);
  } catch (error) {
    console.error("Translation error:", error.response?.data || error.message);
    return texts; 
  }
};



const translateJSON = async (content, toLang) => {
  try {
    const response = await axios({
      method: 'POST',
      baseURL: 'https://api.cognitive.microsofttranslator.com',
      url: '/translate',
      params: {
        'api-version': '3.0',
        to: toLang,
      },
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.MS_TRANSLATOR_KEY,
        'Ocp-Apim-Subscription-Region': process.env.MS_TRANSLATOR_REGION,
        'Content-Type': 'application/json',
      },
      data: [{ Text: JSON.stringify(content) }],
    });

    const translatedJsonStr = response.data[0].translations[0].text;
    return JSON.parse(translatedJsonStr);
  } catch (error) {
    console.error('Translation JSON error:', error.response?.data || error.message);
    return content; 
  }
};



module.exports = {translateJSON,translateText};
