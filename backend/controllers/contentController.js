const Content = require('../models/Content');

const getPrivacyPolicy = async (req, res) => {
  try {
    let content = await Content.findOne({ type: 'privacy-policy' });
    
    if (!content) {
      content = await Content.create({
        type: 'privacy-policy',
        content: 'Privacy Policy content has not been set yet.'
      });
    }
    
    res.status(200).json({
      success: true,
      content: content.content,
      updatedAt: content.updatedAt,
      version: content.version
    });
  } catch (error) {
    console.error('Error fetching privacy policy:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching privacy policy',
      error: error.message
    });
  }
};

const updatePrivacyPolicy = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (content === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }
    
    const updatedContent = await Content.findOneAndUpdate(
      { type: 'privacy-policy' },
      { 
        content,
        lastUpdatedBy: req.userId,
        $inc: { version: 1 }
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Privacy policy updated successfully',
      content: updatedContent.content,
      updatedAt: updatedContent.updatedAt,
      version: updatedContent.version
    });
  } catch (error) {
    console.error('Error updating privacy policy:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating privacy policy',
      error: error.message
    });
  }
};

const getTermsConditions = async (req, res) => {
  try {
    let content = await Content.findOne({ type: 'terms-conditions' });
    
    if (!content) {
      content = await Content.create({
        type: 'terms-conditions',
        content: 'Terms and Conditions content has not been set yet.'
      });
    }
    
    res.status(200).json({
      success: true,
      content: content.content,
      updatedAt: content.updatedAt,
      version: content.version
    });
  } catch (error) {
    console.error('Error fetching terms and conditions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching terms and conditions',
      error: error.message
    });
  }
};

const updateTermsConditions = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (content === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }
    
    const updatedContent = await Content.findOneAndUpdate(
      { type: 'terms-conditions' },
      { 
        content,
        lastUpdatedBy: req.userId,
        $inc: { version: 1 }
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Terms and conditions updated successfully',
      content: updatedContent.content,
      updatedAt: updatedContent.updatedAt,
      version: updatedContent.version
    });
  } catch (error) {
    console.error('Error updating terms and conditions:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating terms and conditions',
      error: error.message
    });
  }
};

module.exports = {
  getPrivacyPolicy,
  updatePrivacyPolicy,
  getTermsConditions,
  updateTermsConditions
};
