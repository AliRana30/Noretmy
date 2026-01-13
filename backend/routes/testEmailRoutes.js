const express = require('express');
const router = express.Router();
const { 
  sendVerificationEmail, 
  sendTestEmail,
  sendOrderAcceptedEmail,
  sendOrderRejectedEmail 
} = require('../services/emailService');
const { verifyToken } = require('../middleware/jwt');

// Test endpoint to send a test email (protected - admin only)
router.post('/test-email', verifyToken, async (req, res) => {
  try {
    // Only allow admins to test emails
    if (req.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admins can test email functionality' 
      });
    }

    const { email, type = 'test' } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email address is required' 
      });
    }

    let result;
    
    switch (type) {
      case 'verification':
        await sendVerificationEmail(email, 'test-token-123');
        result = { message: 'Verification email sent' };
        break;
        
      case 'order-accepted':
        await sendOrderAcceptedEmail(email, {
          _id: '123456',
          buyerName: 'Test Buyer',
          gigTitle: 'Test Service',
          price: 50
        });
        result = { message: 'Order accepted email sent' };
        break;
        
      case 'order-rejected':
        await sendOrderRejectedEmail(email, {
          _id: '123456',
          buyerName: 'Test Buyer',
          gigTitle: 'Test Service',
          reason: 'Cannot complete this order at this time'
        });
        result = { message: 'Order rejected email sent' };
        break;
        
      case 'test':
      default:
        await sendTestEmail(email, 'This is a test email from Noretmy production server.');
        result = { message: 'Test email sent' };
        break;
    }

    return res.status(200).json({
      success: true,
      ...result,
      sentTo: email
    });

  } catch (error) {
    console.error('Test email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// Health check for email service
router.get('/email-health', async (req, res) => {
  try {
    const { verifyEmailConnection } = require('../services/emailService');
    const health = await verifyEmailConnection();
    
    return res.status(health.success ? 200 : 500).json({
      ...health,
      config: {
        host: process.env.SMTP_HOST || 'not set',
        port: process.env.SMTP_PORT || 'not set',
        service: process.env.SMTP_SERVICE || 'not set',
        user: process.env.SMTP_MAIL ? '***@' + process.env.SMTP_MAIL.split('@')[1] : 'not set',
        hasPassword: !!process.env.SMTP_PASSWORD
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
