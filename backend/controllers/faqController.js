const FAQ = require('../models/FAQ');
const createError = require('../utils/createError');

const getCategories = async (req, res) => {
  try {
    const categories = FAQ.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json(createError('Failed to fetch categories'));
  }
};

const getFAQsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { activeOnly = 'true' } = req.query;
    
    const faqs = await FAQ.getByCategory(category, activeOnly === 'true');
    
    res.json({
      success: true,
      data: faqs.map(faq => faq.toAPIResponse())
    });
  } catch (error) {
    console.error('Error fetching FAQs by category:', error);
    res.status(500).json(createError('Failed to fetch FAQs'));
  }
};

const getAllFAQs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      isActive, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [faqs, total] = await Promise.all([
      FAQ.find(query)
        .populate('createdBy', 'username email')
        .populate('updatedBy', 'username email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      FAQ.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: faqs.map(faq => faq.toAPIResponse()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching all FAQs:', error);
    res.status(500).json(createError('Failed to fetch FAQs'));
  }
};

const getFAQById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const faq = await FAQ.findById(id)
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email');
    
    if (!faq) {
      return res.status(404).json(createError('FAQ not found'));
    }
    
    res.json({
      success: true,
      data: faq.toAPIResponse()
    });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json(createError('Failed to fetch FAQ'));
  }
};

const createFAQ = async (req, res) => {
  try {
    const { category, question, answer, isActive = true, order = 0, faqs } = req.body;
    
    if (faqs && Array.isArray(faqs)) {
      if (faqs.length === 0) {
        return res.status(400).json(createError('FAQs array must not be empty'));
      }
      
      const validFAQs = faqs.map(faq => ({
        ...faq,
        createdBy: req.user.id,
        isActive: faq.isActive !== undefined ? faq.isActive : true,
        order: faq.order || 0
      }));
      
      const createdFAQs = await FAQ.insertMany(validFAQs);
      
      res.status(201).json({
        success: true,
        message: `${createdFAQs.length} FAQs created successfully`,
        data: createdFAQs.map(faq => faq.toAPIResponse())
      });
    } else {
      if (!category || !question || !answer) {
        return res.status(400).json(createError('Category, question, and answer are required'));
      }
      
      const faq = new FAQ({
        category,
        question,
        answer,
        isActive,
        order,
        createdBy: req.userId || req.user?._id
      });
      
      await faq.save();
      
      res.status(201).json({
        success: true,
        message: 'FAQ created successfully',
        data: faq.toAPIResponse()
      });
    }
  } catch (error) {
    console.error('Error creating FAQ(s):', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json(createError(400, error.message || 'Invalid FAQ data'));
    }
    res.status(500).json(createError(500, 'Failed to create FAQ(s)'));
  }
};

const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, question, answer, isActive, order, faqIds, updates } = req.body;
    
    if (faqIds && Array.isArray(faqIds)) {
      if (faqIds.length === 0) {
        return res.status(400).json({ success: false, message: 'FAQ IDs array must not be empty' });
      }
      
      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: 'Updates object is required' });
      }
      
      updates.updatedBy = req.userId || req.user?._id;
      
      const result = await FAQ.updateMany(
        { _id: { $in: faqIds } },
        { $set: updates }
      );
      
      res.json({
        success: true,
        message: `${result.modifiedCount} FAQs updated successfully`
      });
    } else {
      const faq = await FAQ.findById(id);
      
      if (!faq) {
        return res.status(404).json({ success: false, message: 'FAQ not found' });
      }
      
      if (category !== undefined) faq.category = category;
      if (question !== undefined) faq.question = question;
      if (answer !== undefined) faq.answer = answer;
      if (isActive !== undefined) faq.isActive = isActive;
      if (order !== undefined) faq.order = order;
      
      faq.updatedBy = req.userId || req.user?._id;
      
      await faq.save();
      
      res.json({
        success: true,
        message: 'FAQ updated successfully',
        data: faq.toAPIResponse()
      });
    }
  } catch (error) {
    console.error('Error updating FAQ(s):', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message || 'Invalid FAQ data' });
    }
    res.status(500).json({ success: false, message: 'Failed to update FAQ(s)' });
  }
};

const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { faqIds } = req.body;
    
    if (faqIds && Array.isArray(faqIds)) {
      if (faqIds.length === 0) {
        return res.status(400).json(createError('FAQ IDs array must not be empty'));
      }
      
      const result = await FAQ.deleteMany({ _id: { $in: faqIds } });
      
      res.json({
        success: true,
        message: `${result.deletedCount} FAQs deleted successfully`
      });
    } else {
      const faq = await FAQ.findByIdAndDelete(id);
      
      if (!faq) {
        return res.status(404).json(createError('FAQ not found'));
      }
      
      res.json({
        success: true,
        message: 'FAQ deleted successfully'
      });
    }
  } catch (error) {
    console.error('Error deleting FAQ(s):', error);
    res.status(500).json(createError('Failed to delete FAQ(s)'));
  }
};

const getFAQStats = async (req, res) => {
  try {
    const [totalFAQs, activeFAQs, categoryStats] = await Promise.all([
      FAQ.countDocuments(),
      FAQ.countDocuments({ isActive: true }),
      FAQ.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            activeCount: {
              $sum: { $cond: ['$isActive', 1, 0] }
            }
          }
        },
        {
          $project: {
            category: '$_id',
            categoryDisplay: {
              $replaceAll: {
                input: '$_id',
                find: '_',
                replacement: ' & '
              }
            },
            count: 1,
            activeCount: 1
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalFAQs,
        active: activeFAQs,
        inactive: totalFAQs - activeFAQs,
        categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching FAQ stats:', error);
    res.status(500).json(createError('Failed to fetch FAQ statistics'));
  }
};

module.exports = {
  getCategories,
  getFAQsByCategory,
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getFAQStats
};
