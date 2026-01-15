const express = require('express');
const router = express.Router();
const EmailLog = require('../models/EmailLog');
const { 
  verifyEmailConnection, 
  sendTestEmail 
} = require('../services/emailService');
const { verifyToken, requireAdmin } = require('../middleware/jwt');

router.get('/test-connection', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await verifyEmailConnection();
    res.json({
      success: result.success,
      message: result.success ? 'Email service is connected and ready' : 'Email service connection failed',
      error: result.error || null,
      config: {
        emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 5)}...` : 'Not configured',
        smtpService: process.env.SMTP_SERVICE || 'gmail',
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/send-test', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { email, message } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }

    const result = await sendTestEmail(email, message);
    
    res.json({
      success: result.success,
      message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
      messageId: result.messageId,
      error: result.error
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/logs', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      emailType,
      recipient,
      startDate,
      endDate
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (emailType) query.emailType = emailType;
    if (recipient) query.recipient = new RegExp(recipient, 'i');
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [logs, total] = await Promise.all([
      EmailLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      EmailLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const stats = await EmailLog.getEmailStats(parseInt(days));
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/failed', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { hours = 24, limit = 50 } = req.query;
    const failedEmails = await EmailLog.getFailedEmails(parseInt(hours));
    
    res.json({
      success: true,
      data: failedEmails.slice(0, parseInt(limit)),
      count: failedEmails.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/retry/:logId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { logId } = req.params;
    
    const emailLog = await EmailLog.findById(logId);
    if (!emailLog) {
      return res.status(404).json({
        success: false,
        error: 'Email log not found'
      });
    }

    if (emailLog.status !== 'failed') {
      return res.status(400).json({
        success: false,
        error: 'Can only retry failed emails'
      });
    }

    if (emailLog.retryCount >= emailLog.maxRetries) {
      return res.status(400).json({
        success: false,
        error: 'Maximum retries exceeded for this email'
      });
    }

    res.json({
      success: true,
      message: 'Email marked for retry',
      emailLog: {
        id: emailLog._id,
        recipient: emailLog.recipient,
        subject: emailLog.subject,
        retryCount: emailLog.retryCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/logs/:logId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { logId } = req.params;
    
    const emailLog = await EmailLog.findById(logId)
      .populate('userId', 'username email')
      .populate('orderId', '_id gigTitle')
      .lean();
      
    if (!emailLog) {
      return res.status(404).json({
        success: false,
        error: 'Email log not found'
      });
    }

    res.json({
      success: true,
      data: emailLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
