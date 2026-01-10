const nodemailer = require('nodemailer');
require('dotenv').config();

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const Vat = require('../models/Vat');
const EmailLog = require('../models/EmailLog');

// ============================================
// EMAIL TRANSPORTER & LOGGING UTILITIES
// ============================================

// Create reusable transporter
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10);
  const smtpService = process.env.SMTP_SERVICE;
  const smtpUser = process.env.SMTP_MAIL || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;
  const smtpSecure = (process.env.SMTP_SECURE || '').toLowerCase() === 'true' || smtpPort === 465;

  if (!smtpUser || !smtpPass) {
    throw new Error('Email configuration missing: set SMTP_MAIL/SMTP_PASSWORD (preferred) or EMAIL_USER/EMAIL_PASS.');
  }

  return nodemailer.createTransport({
    service: smtpService,
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    // Connection pool for better performance
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    // Timeouts
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });
};

const getFrontendBaseUrl = () => {
  const raw =
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    process.env.APP_URL ||
    process.env.WEBSITE_URL ||
    'https://noretmy.com';

  return String(raw).replace(/\/$/, '');
};

// Verify transporter connection
const verifyEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'Email service connected' };
  } catch (error) {
    console.error('❌ Email service connection failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Core email sending function with logging
const sendEmailWithLogging = async (options) => {
  const {
    to,
    subject,
    html,
    emailType,
    userId = null,
    orderId = null,
    recipientName = '',
    recipientType = 'user',
    metadata = {},
    attachments = []
  } = options;

  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Create log entry for each attempt if needed, or update existing one
    let emailLog = null;
    try {
      emailLog = new EmailLog({
        recipient: to,
        recipientName,
        recipientType,
        subject,
        emailType,
        userId,
        orderId,
        metadata: { ...metadata, attempt },
        status: 'pending'
      });
      await emailLog.save();
    } catch (logError) {
      console.error('Failed to create email log:', logError.message);
    }

    try {
      const transporter = createTransporter();
      
      const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_MAIL || process.env.EMAIL_USER;
      const mailOptions = {
        from: fromAddress ? `"Noretmy" <${fromAddress}>` : 'Noretmy',
        to,
        subject,
        html,
        attachments
      };

      console.log(`📧 [Attempt ${attempt}/${maxRetries}] Sending ${emailType} email to ${to}...`);
      const result = await transporter.sendMail(mailOptions);
      
      if (emailLog) {
        await emailLog.markAsSent({
          messageId: result.messageId,
          response: result.response,
          accepted: result.accepted,
          rejected: result.rejected
        });
      }
      
      console.log(`✅ ${emailType} email sent successfully to ${to}`);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      lastError = error;
      if (emailLog) {
        await emailLog.markAsFailed(error);
      }
      
      console.error(`❌ [Attempt ${attempt}/${maxRetries}] Email failed: ${emailType} to ${to} - ${error.message}`);
      
      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If all retries failed, throw error
  const errorMessage = lastError?.message || 'Failed to send email after multiple attempts';
  console.error(`❌ Email sending failed permanently: ${errorMessage}`);
  throw new Error(errorMessage);
};

const sendVerificationEmail = async (email, token) => {
  const emailSubject = 'Email Verification - Noretmy';
  const frontendBaseUrl = getFrontendBaseUrl();
  const verifyUrl = `${frontendBaseUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  const emailBody = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; background-color: #f7f7f7; margin: 0; padding: 20px; }
          .header { padding: 10px; text-align: center; color: white; }
          .header h1 { font-family: 'Arial', sans-serif; font-size: 36px; font-weight: bold; margin: 0; color: #ea581e; letter-spacing: 2px; }
          .content { margin-top: 20px; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
          .footer a { color: #ea581e; text-decoration: none; }
          .divider { border-top: 1px solid #ddd; margin: 10px 0; }
          .button { display: inline-block; padding: 15px 25px; margin-top: 20px; font-size: 16px; color: #fff; background-color: #ea581e; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="header"><h1>noretmy</h1></div>
        <div class="content">
          <p>Hello,</p>
          <p>Thank you for registering with Noretmy. To complete your registration, please verify your email address by clicking the button below:</p>
          <a href="${verifyUrl}" class="button">Verify Your Email</a>
          <div class="divider"></div>
          <p>If you did not register for this account, please ignore this email.</p>
          <p>Best regards,<br>The Noretmy Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Noretmy | All Rights Reserved</p>
          <p><a href="https://www.noretmy.com" target="_blank">Visit Our Website</a></p>
        </div>
      </body>
    </html>
  `;

  return sendEmailWithLogging({
    to: email,
    subject: emailSubject,
    html: emailBody,
    emailType: 'verification',
    metadata: { token }
  });
};

// Send welcome email after successful signup and verification
const sendWelcomeEmail = async (email, fullName, isSeller) => {
  const firstName = fullName.split(' ')[0];
  const userRole = isSeller ? 'freelancer' : 'client';
  const emailSubject = 'Welcome to Noretmy!';
  const frontendBaseUrl = getFrontendBaseUrl();
  const ctaUrl = `${frontendBaseUrl}/${isSeller ? 'dashboard' : 'search-gigs'}`;
  
  const emailBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #2d3748; 
            background-color: #f7fafc; 
            margin: 0; 
            padding: 0; 
          }
          .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background-color: #ffffff; 
            border-radius: 12px; 
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
          }
          .header { 
            background: linear-gradient(135deg, #ea581e 0%, #f97316 100%);
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { 
            font-size: 32px; 
            font-weight: 700; 
            margin: 0; 
            color: #ffffff; 
            letter-spacing: 1px; 
          }
          .content { 
            padding: 40px 30px; 
          }
          .content h2 { 
            font-size: 24px; 
            font-weight: 600; 
            color: #1a202c; 
            margin: 0 0 20px 0; 
          }
          .content p { 
            font-size: 16px; 
            color: #4a5568; 
            margin: 0 0 16px 0; 
          }
          .feature-list { 
            background-color: #f7fafc; 
            border-radius: 8px; 
            padding: 24px; 
            margin: 30px 0; 
          }
          .feature-item { 
            padding: 12px 0; 
            border-bottom: 1px solid #e2e8f0; 
          }
          .feature-item:last-child { 
            border-bottom: none; 
          }
          .feature-title { 
            font-weight: 600; 
            color: #2d3748; 
            margin-bottom: 4px; 
          }
          .feature-desc { 
            font-size: 14px; 
            color: #718096; 
          }
          .cta-button { 
            display: inline-block; 
            padding: 14px 32px; 
            margin: 24px 0; 
            font-size: 16px; 
            font-weight: 600; 
            color: #ffffff; 
            background-color: #ea581e; 
            text-decoration: none; 
            border-radius: 6px; 
            transition: background-color 0.3s;
          }
          .footer { 
            background-color: #f7fafc; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e2e8f0; 
          }
          .footer p { 
            font-size: 14px; 
            color: #718096; 
            margin: 8px 0; 
          }
          .footer a { 
            color: #ea581e; 
            text-decoration: none; 
          }
          .divider { 
            height: 1px; 
            background-color: #e2e8f0; 
            margin: 24px 0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>noretmy</h1>
          </div>
          
          <div class="content">
            <h2>Welcome, ${firstName}!</h2>
            <p>Thank you for joining Noretmy, the trusted platform connecting talented freelancers with clients worldwide.</p>
            
            <p>Your account has been successfully created${isSeller ? ' as a freelancer' : ''}. You now have access to a comprehensive platform designed to make ${isSeller ? 'selling your services' : 'hiring top talent'} seamless and secure.</p>
            
            <div class="feature-list">
              <div class="feature-title">Here's what you can do next:</div>
              <div class="divider"></div>
              
              ${isSeller ? `
              <div class="feature-item">
                <div class="feature-title">Create Your First Gig</div>
                <div class="feature-desc">Showcase your skills and start attracting clients</div>
              </div>
              <div class="feature-item">
                <div class="feature-title">Set Up Your Profile</div>
                <div class="feature-desc">Add your portfolio, skills, and experience</div>
              </div>
              <div class="feature-item">
                <div class="feature-title">Promote Your Services</div>
                <div class="feature-desc">Use our promotion tools to increase visibility</div>
              </div>
              <div class="feature-item">
                <div class="feature-title">Secure Payments</div>
                <div class="feature-desc">Get paid safely with our milestone-based escrow system</div>
              </div>
              ` : `
              <div class="feature-item">
                <div class="feature-title">Browse Services</div>
                <div class="feature-desc">Explore thousands of gigs from talented freelancers</div>
              </div>
              <div class="feature-item">
                <div class="feature-title">Post Custom Requests</div>
                <div class="feature-desc">Let freelancers come to you with proposals</div>
              </div>
              <div class="feature-item">
                <div class="feature-title">Payment Protection</div>
                <div class="feature-desc">Your money is safe with milestone-based escrow</div>
              </div>
              <div class="feature-item">
                <div class="feature-title">24/7 Support</div>
                <div class="feature-desc">Our team is here to help whenever you need us</div>
              </div>
              `}
            </div>
            
            <p>Ready to get started? Click the button below to complete your profile and ${isSeller ? 'create your first gig' : 'find the perfect freelancer'}.</p>
            
            <center>
              <a href="${ctaUrl}" class="cta-button">Get Started</a>
            </center>
            
            <div class="divider"></div>
            
            <p style="font-size: 14px; color: #718096;">If you have any questions or need assistance, feel free to reach out to our support team at <a href="mailto:support@noretmy.com" style="color: #ea581e;">support@noretmy.com</a></p>
          </div>
          
          <div class="footer">
            <p><strong>Noretmy</strong> - Connecting Talent with Opportunity</p>
            <p>&copy; 2026 Noretmy. All rights reserved.</p>
            <p>
              <a href="https://www.noretmy.com">Visit Website</a> | 
              <a href="https://www.noretmy.com/help">Help Center</a> | 
              <a href="https://www.noretmy.com/terms">Terms</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmailWithLogging({
    to: email,
    subject: emailSubject,
    html: emailBody,
    emailType: 'welcome',
    recipientName: fullName,
    metadata: { userRole }
  });
};

const sendUserNotificationEmail = async (email, type, emailMessage, userType, orderDetails) => {
  const isSellerUser = userType === 'seller';
  const recipientLabel = isSellerUser ? 'Seller' : 'Client';

  let subject = 'Noretmy Notification';
  let html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <p>Dear ${recipientLabel},</p>
      <p>${emailMessage || ''}</p>
      <p>Best regards,<br>The Noretmy Team</p>
    </div>
  `;
  const attachments = [];

  if (type === 'warn') {
    subject = isSellerUser ? 'Seller Warning Notice' : 'Warning Notice';
    html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Dear ${recipientLabel},</p>
        <p>We have observed some activities on your account that violate our terms of service. Please be aware that continued violations may result in further action.</p>
        <p>We encourage you to review our guidelines to avoid any future issues.</p>
        <p>Best regards,<br>The Noretmy Team</p>
      </div>
    `;
  } else if (type === 'block') {
    subject = isSellerUser ? 'Seller Account Blocked' : 'Account Blocked';
    html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="text-align: center; color: #e46625;">Your account has been disabled</h2>
        <p>Dear ${recipientLabel},</p>
        <p>We regret to inform you that due to repeated violations of our terms of service, your account has been permanently blocked.</p>
        <p>${emailMessage ? `${emailMessage}` : ''}</p>
        <p>If you believe this decision was made in error, please contact our support team for further assistance.</p>
        <p>Best regards,<br>The Noretmy Team</p>
      </div>
    `;
  } else if (type === 'verified') {
    subject = 'Your account has been verified';
    html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="text-align: center; color: #e46625;">Account Verified</h2>
        <p>Dear ${recipientLabel},</p>
        <p>${emailMessage || 'Your account has been verified and approved by our admin team.'}</p>
        <p>Best regards,<br>The Noretmy Team</p>
      </div>
    `;
  } else if (type === 'emailReply') {
    const ticketNumber = Math.floor(Math.random() * 1000000);
    subject = `Noretmy - Ticket #${ticketNumber}`;
    html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Dear User,</p>
        <p>${emailMessage || ''}</p>
        <p>Best regards,<br>The Noretmy Team</p>
      </div>
    `;
  } else if (type === 'invoice') {
    const orderId = orderDetails?._id || orderDetails?.orderId || orderDetails?.id || 'N/A';
    const priceRaw = orderDetails?.price;
    const createdAtRaw = orderDetails?.createdAt;

    const amountInDollars = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw || 0);
    const createdAt = createdAtRaw ? new Date(createdAtRaw).toISOString() : '';

    const feePercentage = 0.02;
    const fixedFee = 0.35;
    const feeAmount = amountInDollars * feePercentage;
    const totalAmount = amountInDollars + feeAmount + fixedFee;

    subject = `Invoice for Your Order #${orderId}`;
    html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="text-align: center; color: #e46625;">Invoice</h2>
        <p>Dear ${recipientLabel},</p>
        <p>Thank you for using Noretmy. Below are the details of your invoice:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Order ID</th>
            <td style="border: 1px solid #ddd; padding: 8px;">${orderId}</td>
          </tr>
          ${createdAt ? `
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Order Date</th>
            <td style="border: 1px solid #ddd; padding: 8px;">${createdAt}</td>
          </tr>` : ''}
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Subtotal</th>
            <td style="border: 1px solid #ddd; padding: 8px;">$${amountInDollars.toFixed(2)}</td>
          </tr>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Fee (2%)</th>
            <td style="border: 1px solid #ddd; padding: 8px;">$${feeAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Service Charge</th>
            <td style="border: 1px solid #ddd; padding: 8px;">$${fixedFee.toFixed(2)}</td>
          </tr>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Total</th>
            <td style="border: 1px solid #ddd; padding: 8px;">$${totalAmount.toFixed(2)}</td>
          </tr>
        </table>
        <p>Best regards,<br>The Noretmy Team</p>
      </div>
    `;

    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 850]);
      const fontSize = 12;
      const text = `Invoice for Order #${orderId}\n\nSubtotal: $${amountInDollars.toFixed(2)}\nFee (2%): $${feeAmount.toFixed(2)}\nService Charge: $${fixedFee.toFixed(2)}\nTotal: $${totalAmount.toFixed(2)}`;
      page.drawText(text, {
        x: 50,
        y: 800,
        size: fontSize,
        maxWidth: 500,
        lineHeight: 16,
      });
      const pdfBytes = await pdfDoc.save();
      attachments.push({
        filename: 'invoice.pdf',
        content: pdfBytes,
        contentType: 'application/pdf',
      });
    } catch (pdfError) {
      console.error('Error generating invoice PDF:', pdfError.message);
    }
  }

  const mailOptions = {
    to: email,
    subject,
    html,
    ...(attachments.length > 0 ? { attachments } : {}),
  };

  try {
    console.log(`📧 [sendUserNotificationEmail] Sending type=${type} to=${email} subject="${subject}"`);
    const result = await sendEmailWithLogging({
      ...mailOptions,
      emailType: `user_notification_${type || 'generic'}`,
      recipientType: isSellerUser ? 'seller' : 'buyer',
      recipientName: recipientLabel,
      metadata: { type, userType, hasOrderDetails: !!orderDetails },
    });
    console.log(`✅ [sendUserNotificationEmail] Sent to=${email} messageId=${result?.messageId || 'n/a'}`);
    return result;
  } catch (err) {
    console.error(`❌ [sendUserNotificationEmail] Failed to send type=${type} to=${email}:`, err?.message || err);
    throw err;
  }
};

const sendWithdrawalStripeNotificationEmail = async (email, stripeLink) => {
  const mailOptions = {
    to: email,
    subject: 'Complete Onboarding to Withdraw Funds',
    html: `
      <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <h1 style="color: #007bff; text-align: center;">Payment Notification</h1>
          <h2 style="color: #333; text-align: center;">Action Required: Complete Onboarding</h2>
          <p>Dear User,</p>
          <p>We noticed you attempted to withdraw funds from your account. To proceed with your withdrawal, please complete the onboarding process using the link below:</p>
          <a href="${stripeLink}" 
             style="display: inline-block; padding: 15px 25px; margin-top: 20px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
             Complete Onboarding
          </a>
          <p>If you have already completed onboarding, this email may have been sent in error. In that case, please contact our support team for assistance.</p>
          <p>Thank you for your cooperation.</p>
          <p>Best regards,<br>The Noretmy Team</p>
          <div style="margin-top: 20px; font-size: 12px; color: #666;">
            <p>If you have any questions, feel free to reply to this email or reach out to our support team.</p>
            <p>&copy; 2024 Noretmy, Inc. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sendEmailWithLogging({
      ...mailOptions,
      emailType: 'withdrawal_onboarding',
      metadata: { stripeLink },
    });
    } catch (error) {
    console.error('Error sending payment notification email:', error.message);
  }
};

const sendWithdrawalSuccessEmail = async (email, amount) => {
  const mailOptions = {
    to: email,
    subject: 'Withdrawal Request Successful',
    html: `
      <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <h1 style="color: #28a745; text-align: center;">Withdrawal Successful</h1>
          <h2 style="color: #333; text-align: center;">Funds Will Be Cleared Soon</h2>
          <p>Dear User,</p>
          <p>We are pleased to inform you that your withdrawal request of <strong>$${amount}</strong> has been successfully processed.</p>
          <p>Your funds will be cleared and available in your account within 3 to 5 business days.</p>
          <p>If you have any questions or need further assistance, please do not hesitate to reach out to our support team.</p>
          <p>Thank you for choosing Noretmy!</p>
          <p>Best regards,<br>The Noretmy Team</p>
          <div style="margin-top: 20px; font-size: 12px; color: #666;">
            <p>If you have any questions, feel free to reply to this email or reach out to our support team.</p>
            <p>&copy; 2024 Noretmy, Inc. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sendEmailWithLogging({
      ...mailOptions,
      emailType: 'withdrawal_success',
      metadata: { amount },
    });
    } catch (error) {
    console.error('Error sending withdrawal success email:', error.message);
  }
};

const sendWithdrawalRejectionEmail = async (email, reason) => {
  const mailOptions = {
    to: email,
    subject: 'Withdrawal Request Rejected',
    html: `
      <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <h1 style="color: #dc3545; text-align: center;">Withdrawal Request Rejected</h1>
          <p>Dear User,</p>
          <p>We regret to inform you that your withdrawal request has been rejected for the following reason:</p>
          <blockquote style="border-left: 4px solid #dc3545; margin: 20px 0; padding-left: 15px; color: #555;">${reason}</blockquote>
          <p>If you have any questions or need further clarification, please feel free to contact our support team.</p>
          <p>We apologize for any inconvenience caused.</p>
          <p>Best regards,<br>The Noretmy Team</p>
          <div style="margin-top: 20px; font-size: 12px; color: #666;">
            <p>If you have any questions, feel free to reply to this email or reach out to our support team.</p>
            <p>&copy; 2024 Noretmy, Inc. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sendEmailWithLogging({
      ...mailOptions,
      emailType: 'withdrawal_rejected',
      metadata: { reason },
    });
    } catch (error) {
    console.error('Error sending withdrawal rejection email:', error.message);
  }
};

  const sendOrderSuccessEmail = async (email, orderDetails) => {
    const safeOrderId = orderDetails?._id || orderDetails?.orderId || orderDetails?.id || 'N/A';
    const price = orderDetails?.price ?? 0;
    const createdAt = orderDetails?.createdAt ?? '';
    const vatRate = orderDetails?.vatRate ?? 0;
    const customerName = orderDetails?.customerName ?? 'Customer';
    const gigTitle = orderDetails?.gigTitle ?? 'Service';
    const discount = orderDetails?.discount ?? 0;

    const orderId = safeOrderId;

    let discountedPrice = price;
    let discountAmount = 0;

    if (discount !== null && discount > 0) {
      discountAmount = price * (discount / 100);
      discountedPrice = price - discountAmount;
    }

    const vatAmount = price * vatRate;
    const platformFeeRate = 0.02;
    const platformFee = price * platformFeeRate;
    const totalAmount = price + vatAmount + platformFee;

    // Email Content
    
    const emailSubject = `Order Invoice - #${orderId}`;
    const emailBody = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #333;
              background-color: #f7f7f7;
              margin: 0;
              padding: 20px;
            }
            .header {
              padding: 10px;
              text-align: center;
              color: white;
            }
            .header h1 {
              font-family: 'Arial', sans-serif;
              font-size: 24px;
              font-weight: bold;
              margin: 0;
              color: #ea581e;
              letter-spacing: 2px;
            }
              .header h4 {
              color: #000000;
            }
            .content {
              margin-top: 10px;
              background-color: white;
              padding: 10px;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #888;
            }
            .footer a {
              color: #e46625;
              text-decoration: none;
            }
            .order-summary th, .order-summary td {
              padding: 8px 12px;
              border: 1px solid #ddd;
            }
            .order-summary th {
              background-color: #f4f4f4;
              text-align: left;
            }
            .order-summary td {
              text-align: right;
            }
            .total {
              font-size: 18px;
              font-weight: bold;
              text-align: right;
              margin-top: 20px;
            }
            .divider {
              border-top: 1px solid #ddd;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>noretmy</h1>
            <h4>Invoice for Your Order #${orderId}</h4>
          </div>
          <div class="content">
            <p>Dear ${customerName},</p>
            <p>Thank you for your order! Your order has been successfully placed. Below are the details of your invoice:</p>

            <table class="order-summary" width="100%">
              <tr>
                <th>Order Number</th>
                <td>#${orderId}</td>
              </tr>
              <tr>
                <th>Order Date</th>
                <td>${createdAt}</td>
              </tr>
              <tr>
                <th>Service</th>
                <td>${gigTitle}</td>
              </tr>
              <tr>
                <th>Subtotal</th>
                <td>$${price.toFixed(2)}</td>
              </tr>
              <tr>
                <th>VAT (${vatRate*100}%)</th>
                <td>$${vatAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <th>Service Fee (2%)</th>
                <td>$${platformFee.toFixed(2)}</td>
              </tr>
                ${discount !== null && discount > 0 ? `
              <tr>
                <th>Discount (${discount}%)</th>
                <td>-$${discountAmount.toFixed(2)}</td>
              </tr>` : ''}
              <tr class="total">
                <th>Total Amount</th>
                <td>$${totalAmount.toFixed(2)}</td>
              </tr>
            </table>

            <div class="divider"></div>

            <p>If you have any questions about your order, please feel free to contact us at <a href="mailto:info@noretmy.com">info@noretmy.com</a>.</p>
            <p>We look forward to serving you again soon!</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Noretmy | All Rights Reserved</p>
            <p><a href="https://www.noretmy.com" target="_blank">Visit Our Website</a></p>
          </div>
        </body>
      </html>
    `;

    return sendEmailWithLogging({
      to: email,
      subject: emailSubject,
      html: emailBody,
      emailType: 'order_invoice',
      orderId,
      recipientName: customerName,
      recipientType: 'buyer',
      metadata: { gigTitle, price, vatRate, discount, discountedPrice, totalAmount },
    });
  };

const sendSellerOrderNotificationEmail = async (email, orderDetails) => {
  const { _id: orderId, price, gigTitle, sellerName,createdAt } = orderDetails;
  const frontendBaseUrl = getFrontendBaseUrl();

  // Email Content
  const emailSubject = `New Order Received - #${orderId}`;
  const emailBody = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            background-color: #f7f7f7;
            margin: 0;
            padding: 20px;
          }
          .header {
            padding: 10px;
            text-align: center;
            color: white;
          }
          .header h1 {
            font-family: 'Arial', sans-serif;
            font-size: 36px;
            font-weight: bold;
            margin: 0;
            color: #ea581e;
            letter-spacing: 2px;
          }
            .header h4{
            color : #000000;
            }
          .content {
            margin-top: 20px;
            background-color: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #888;
          }
          .footer a {
            color: #e46625;
            text-decoration: none;
          }
          .order-summary th, .order-summary td {
            padding: 8px 12px;
            border: 1px solid #ddd;
          }
          .order-summary th {
            background-color: #f4f4f4;
            text-align: left;
          }
          .order-summary td {
            text-align: right;
          }
          .divider {
            border-top: 1px solid #ddd;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
        <h1>noretmy</h1>
        <h4>New Order Received - #${orderId}</h4>
        </div>
        <div class="content">
          <p>Dear ${sellerName},</p>
          <p>You have received a new order! Below are the details:</p>

          <table class="order-summary" width="100%">
            <tr>
              <th>Order Number</th>
              <td>#${orderId}</td>
            </tr>
            <tr>
              <th>Gig Title</th>
              <td>${gigTitle}</td>
            </tr>
                        <tr>
              <th>Order Created At</th>
              <td>$${createdAt}</td>
            </tr>
            <tr>
              <th>Order Price</th>
              <td>$${price.toFixed(2)}</td>
            </tr>

          </table>

          <div class="divider"></div>

          <p>Please visit your <a href="${frontendBaseUrl}/orders" target="_blank">dashboard</a> to start working on the order.</p>
          <p>If you have any questions, feel free to reach out to us at <a href="mailto:info@noretmy.com">info@noretmy.com</a>.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Noretmy | All Rights Reserved</p>
          <p><a href="https://www.noretmy.com" target="_blank">Visit Our Website</a></p>
        </div>
      </body>
    </html>
  `;

  return sendEmailWithLogging({
    to: email,
    subject: emailSubject,
    html: emailBody,
    emailType: 'seller_order_notification',
    orderId,
    recipientName: sellerName,
    recipientType: 'seller',
    metadata: { gigTitle, price, createdAt },
  });
};

const sendPromotionPlanEmail = async (email, promotionDetails) => {
  
  const { 
    promotionPlanId, 
    customerName, 
    gigTitle, 
    createdAt, 
    price, 
    vatRate 
  } = promotionDetails;

  // VAT and Total Calculations
  const vatAmount = (price * vatRate);
  const platformFeeRate = 0.02;
  const platformFee = price * platformFeeRate;
  const totalAmount = price + vatAmount + platformFee;

  // Email Content
  const emailSubject = `Promotion Plan Activated - ${gigTitle}`;
  const emailBody = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            background-color: #f7f7f7;
            margin: 0;
            padding: 20px;
          }
          .header {
            padding: 10px;
            text-align: center;
            color: white;
          }
          .header h1 {
            font-family: 'Arial', sans-serif;
            font-size: 36px;
            font-weight: bold;
            margin: 0;
            color: #ea581e;
            letter-spacing: 2px;
          }
            .header h4{
            color : #000000;
            }
          .content {
            margin-top: 20px;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #888;
          }
          .footer a {
            color: #e46625;
            text-decoration: none;
          }
          .promotion-summary th, .promotion-summary td {
            padding: 8px 12px;
            border: 1px solid #ddd;
          }
          .promotion-summary th {
            background-color: #f4f4f4;
            text-align: left;
          }
          .promotion-summary td {
            text-align: right;
          }
          .total {
            font-size: 18px;
            font-weight: bold;
            text-align: right;
            margin-top: 20px;
          }
          .divider {
            border-top: 1px solid #ddd;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
        <h1>noretmy</h1>
        <h4>Promotion Plan Activated</h4>
        </div>
        <div class="content">
          <p>Dear ${customerName},</p>
          <p>Your gig titled <strong>"${gigTitle}"</strong> has been successfully promoted for 30 days under the selected plan. Below are the details:</p>

          <table class="promotion-summary" width="100%">
            <tr>
              <th>Promotion Plan ID</th>
              <td>${promotionPlanId}</td>
            </tr>
            <tr>
              <th>Email Sent Date</th>
              <td>${createdAt}</td>
            </tr>
            <tr>
              <th>Gig Description</th>
              <td>${gigTitle}</td>
            </tr>
            <tr>
              <th>Subtotal</th>
              <td>$${price.toFixed(2)}</td>
            </tr>
            <tr>
              <th>VAT (${vatRate*100}%)</th>
              <td>$${vatAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <th>Service Fee (2%)</th>
              <td>$${platformFee.toFixed(2)}</td>
            </tr>
            <tr class="total">
              <th>Total Amount</th>
              <td>$${totalAmount.toFixed(2)}</td>
            </tr>
          </table>

          <div class="divider"></div>

          <p>If you have any questions about your promotion plan, please contact us at <a href="mailto:info@noretmy.com">info@noretmy.com</a>.</p>
          <p>We hope your gig achieves great results!</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Noretmy | All Rights Reserved</p>
          <p><a href="https://www.noretmy.com" target="_blank">Visit Our Website</a></p>
        </div>
      </body>
    </html>
  `;

  return sendEmailWithLogging({
    to: email,
    subject: emailSubject,
    html: emailBody,
    emailType: 'promotion_invoice_single_gig',
    recipientName: customerName,
    recipientType: 'user',
    metadata: { promotionPlanId, gigTitle, createdAt, price, vatRate, vatAmount, platformFee, totalAmount },
  });
};

const sendAllGigsPromotionEmail = async (email, promotionDetails) => {
  const { 
    promotionPlanId, 
    customerName, 
    createdAt, 
    price, 
    vatRate
  } = promotionDetails;

  // VAT and Total Calculations
  const vatAmount = (price * vatRate);
  const platformFeeRate = 0.02;
  const platformFee = price * platformFeeRate;
  const totalAmount = price + vatAmount + platformFee;

  // Email Content
  const emailSubject = `Promotion Plan Activated - All Gigs ${promotionPlanId}`;
  const emailBody = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            background-color: #f7f7f7;
            margin: 0;
            padding: 20px;
          }
          .header {
            padding: 10px;
            text-align: center;
            color: white;
          }
          .header h1 {
            font-family: 'Arial', sans-serif;
            font-size: 36px;
            font-weight: bold;
            margin: 0;
            color: #ea581e;
            letter-spacing: 2px;
          }
            .header h4{
            color : #000000;
            }
          .content {
            margin-top: 20px;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #888;
          }
          .footer a {
            color: #e46625;
            text-decoration: none;
          }
          .promotion-summary th, .promotion-summary td {
            padding: 8px 12px;
            border: 1px solid #ddd;
          }
          .promotion-summary th {
            background-color: #f4f4f4;
            text-align: left;
          }
          .promotion-summary td {
            text-align: right;
          }
          .total {
            font-size: 18px;
            font-weight: bold;
            text-align: right;
            margin-top: 20px;
          }
          .divider {
            border-top: 1px solid #ddd;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
        <h1>noretmy</h1>
        <h4>Promotion Plan Activated</h4>
        </div>
        <div class="content">
          <p>Dear ${customerName},</p>
          <p>Your promotion plan has been successfully activated. All your gigs are now promoted for 30 days. Below are the details:</p>

          <table class="promotion-summary" width="100%">
            <tr>
              <th>Promotion Plan ID</th>
              <td>${promotionPlanId}</td>
            </tr>
            <tr>
              <th>Email Sent Date</th>
              <td>${createdAt}</td>
            </tr>
            <tr>
              <th>Subtotal</th>
              <td>$${price.toFixed(2)}</td>
            </tr>
            <tr>
              <th>VAT (${vatRate*100}%)</th>
              <td>$${vatAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <th>Service Fee (2%)</th>
              <td>$${platformFee.toFixed(2)}</td>
            </tr>
            <tr class="total">
              <th>Total Amount</th>
              <td>$${totalAmount.toFixed(2)}</td>
            </tr>
          </table>

          <div class="divider"></div>

          <p>If you have any questions about your promotion plan, please contact us at <a href="mailto:info@noretmy.com">info@noretmy.com</a>.</p>
          <p>We hope your gigs achieve great results!</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Noretmy | All Rights Reserved</p>
          <p><a href="https://www.noretmy.com" target="_blank">Visit Our Website</a></p>
        </div>
      </body>
    </html>
  `;

  return sendEmailWithLogging({
    to: email,
    subject: emailSubject,
    html: emailBody,
    emailType: 'promotion_invoice_all_gigs',
    recipientName: customerName,
    recipientType: 'user',
    metadata: { promotionPlanId, createdAt, price, vatRate, vatAmount, platformFee, totalAmount },
  });
};

const sendOnboardingEmail = async (email, freelancerName, onboardingLink) => {
  // Email Content
  const emailSubject = `Complete Your Onboarding to Withdraw Funds`;
  const emailBody = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            background-color: #f7f7f7;
            margin: 0;
            padding: 20px;
          }
          .header {
            padding: 10px;
            text-align: center;
            color: white;
          }
          .header h1 {
            font-family: 'Arial', sans-serif;
            font-size: 24px;
            font-weight: bold;
            margin: 0;
            color: #ea581e;
            letter-spacing: 2px;
          }
          .header h4 {
            color: #000000;
          }
          .content {
            margin-top: 10px;
            background-color: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #888;
          }
          .footer a {
            color: #e46625;
            text-decoration: none;
          }
          .divider {
            border-top: 1px solid #ddd;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>noretmy</h1>
          <h4>Complete Your Onboarding to Withdraw Funds</h4>
        </div>
        <div class="content">
          <p>Dear ${freelancerName},</p>
          <p>We hope this message finds you well.</p>
          <p>It looks like you have not yet completed your onboarding process, which is required before you can withdraw funds. To proceed, please complete the necessary steps by clicking on the link below:</p>
          <p><a href="${onboardingLink}">Complete Onboarding</a></p>

          <p>Once your onboarding is complete, you will be able to withdraw your funds.</p>

          <p>If you have any questions, feel free to contact us at <a href="mailto:info@noretmy.com">info@noretmy.com</a>.</p>
          <p>Thank you for your cooperation!</p>

          <div class="divider"></div>

          <p>We look forward to serving you again soon!</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Noretmy | All Rights Reserved</p>
          <p><a href="https://www.noretmy.com" target="_blank">Visit Our Website</a></p>
        </div>
      </body>
    </html>
  `;

  return sendEmailWithLogging({
    to: email,
    subject: emailSubject,
    html: emailBody,
    emailType: 'withdrawal_onboarding',
    recipientName: freelancerName,
    recipientType: 'seller',
    metadata: { onboardingLink },
  });
};

const sendResetPasswordEmail = async (email, resetLink) => {
  const emailSubject = "Reset Your Password - Noretmy";
  const emailBody = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; background-color: #f7f7f7; margin: 0; padding: 20px; }
          .header { padding: 10px; text-align: center; color: white; }
          .header h1 { font-family: 'Arial', sans-serif; font-size: 24px; font-weight: bold; margin: 0; color: #ea581e; letter-spacing: 2px; }
          .content { margin-top: 10px; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); text-align: center; }
          .button { display: inline-block; background-color: #ea581e; color: white; padding: 12px 24px; font-size: 16px; border-radius: 6px; text-decoration: none; margin-top: 20px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
          .footer a { color: #e46625; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="header"><h1>Noretmy</h1><h4>Password Reset Request</h4></div>
        <div class="content">
          <p>Dear User,</p>
          <p>You have requested to reset your password. Click the button below to proceed:</p>
          <a href="${resetLink}" class="button">Reset Password</a>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Noretmy | All Rights Reserved</p>
          <p><a href="https://www.noretmy.com" target="_blank">Visit Our Website</a></p>
        </div>
      </body>
    </html>
  `;

  return sendEmailWithLogging({
    to: email,
    subject: emailSubject,
    html: emailBody,
    emailType: 'password_reset',
    metadata: { resetLink }
  });
};

const sendOrderRequestEmail = async (email, requestDetails) => {
  const { _id: requestId, details, price, senderName, createdAt, description } = requestDetails;
  const frontendBaseUrl = getFrontendBaseUrl();

  // Email Content
  const emailSubject = `New Custom Order Request - #${requestId}`;
  const emailBody = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            background-color: #f7f7f7;
            margin: 0;
            padding: 20px;
          }
          .header {
            padding: 10px;
            text-align: center;
            color: white;
          }
          .header h1 {
            font-family: 'Arial', sans-serif;
            font-size: 36px;
            font-weight: bold;
            margin: 0;
            color: #ea581e;
            letter-spacing: 2px;
          }
          .header h4 {
            color: #000000;
          }
          .content {
            margin-top: 20px;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #888;
          }
          .footer a {
            color: #e46625;
            text-decoration: none;
          }
          .request-summary th, .request-summary td {
            padding: 8px 12px;
            border: 1px solid #ddd;
          }
          .request-summary th {
            background-color: #f4f4f4;
            text-align: left;
            width: 40%;
          }
          .request-summary td {
            text-align: left;
          }
          .divider {
            border-top: 1px solid #ddd;
            margin: 20px 0;
          }
          .cta-button {
            display: inline-block;
            background-color: #ea581e;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 15px;
          }
          .cta-button:hover {
            background-color: #d04e1a;
          }
          .description-box {
            background-color: #f9f9f9;
            border-left: 4px solid #ea581e;
            padding: 15px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>noretmy</h1>
          <h4>New Custom Order Request - #${requestId}</h4>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You have received a new custom order request from <strong>${senderName}</strong>! Here are the details:</p>

          <table class="request-summary" width="100%">
            <tr>
              <th>Request Number</th>
              <td>#${requestId}</td>
            </tr>
            <tr>
              <th>Sender</th>
              <td>${senderName}</td>
            </tr>
            <tr>
              <th>Request Date</th>
              <td>${createdAt}</td>
            </tr>
            <tr>
              <th>Proposed Price</th>
              <td>$${price.toFixed(2)}</td>
            </tr>
          </table>

          <div class="description-box">
            <h3>Request Description:</h3>
            <p>${description}</p>
          </div>

          <div class="divider"></div>

          <p>Please review this custom order request and respond at your earliest convenience. You can accept, decline, or negotiate the terms of this request.</p>
          
          <p style="text-align: center;">
            <a href="${frontendBaseUrl}/order-request/${requestId}" class="cta-button" target="_blank">View Request Details</a>
          </p>
          
          <p>If you have any questions about this request, you can contact the sender or reach out to our support team at <a href="mailto:support@noretmy.com">support@noretmy.com</a>.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Noretmy | All Rights Reserved</p>
          <p>This email was sent to you because you have an account on Noretmy.</p>
          <p><a href="https://www.noretmy.com" target="_blank">Visit Our Website</a></p>
        </div>
      </body>
    </html>
  `;

  return sendEmailWithLogging({
    to: email,
    subject: emailSubject,
    html: emailBody,
    emailType: 'custom_order_request',
    recipientType: 'user',
    metadata: { requestId, senderName, createdAt, price },
  });
};

const sendNewsletterWelcomeEmail = async (email, subscriberName) => {
  // Email Content
  const emailSubject = `Welcome to Noretmy Newsletter`;
  const emailBody = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            background-color: #f7f7f7;
            margin: 0;
            padding: 20px;
          }
          .header {
            padding: 10px;
            text-align: center;
            color: white;
          }
          .header h1 {
            font-family: 'Arial', sans-serif;
            font-size: 24px;
            font-weight: bold;
            margin: 0;
            color: #ea581e;
            letter-spacing: 2px;
          }
          .header h4 {
            color: #000000;
          }
          .content {
            margin-top: 10px;
            background-color: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #888;
          }
          .footer a {
            color: #e46625;
            text-decoration: none;
          }
          .divider {
            border-top: 1px solid #ddd;
            margin: 10px 0;
          }
          .button {
            display: inline-block;
            background-color: #ea581e;
            color: white;
            padding: 12px 20px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 15px 0;
          }
          .preferences {
            margin-top: 20px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>noretmy</h1>
          <h4>Thank You for Subscribing to Our Newsletter</h4>
        </div>
        <div class="content">
          <p>Dear ${subscriberName || "Valued Subscriber"},</p>
          <p>Thank you for subscribing to the Noretmy newsletter!</p>
          
          <p>You'll now receive regular updates on:</p>
          <ul>
            <li>Industry insights and trends</li>
            <li>New features and services</li>
            <li>Special offers exclusive to our subscribers</li>
            <li>Tips and best practices</li>
          </ul>

          <p>We're committed to providing you with valuable content that helps you make the most of our services.</p>
          
          <a href="https://www.noretmy.com/blogs" class="button">Read Our Latest Updates</a>

          <div class="divider"></div>

          <p>If you have any questions or feedback, please don't hesitate to reach out to our team at <a href="mailto:info@noretmy.com">info@noretmy.com</a>.</p>
          
          <div class="preferences">
            <p>Want to customize your email preferences? <a href="https://www.noretmy.com/email-preferences">Manage your subscription settings here</a>.</p>
           </div>
        </div>
        <div class="footer">
          <p>&copy; 2025 Noretmy | All Rights Reserved</p>
          <p><a href="https://www.noretmy.com" target="_blank">Visit Our Website</a> | <a href="https://www.noretmy.com/privacy-policy" target="_blank">Privacy Policy</a> | <a href="https://www.noretmy.com/unsubscribe" target="_blank">Unsubscribe</a></p>
        </div>
      </body>
    </html>
  `;

  try {
    await sendEmailWithLogging({
      to: email,
      subject: emailSubject,
      html: emailBody,
      emailType: 'newsletter_welcome',
      recipientType: 'user',
    });
    return { success: true };
  } catch (error) {
    console.error(`Failed to send newsletter welcome email to ${email}:`, error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PAYMENT MILESTONE EMAIL FUNCTIONS
// ============================================

const sendPaymentMilestoneEmail = async (email, milestoneDetails) => {
  const {
    orderId,
    stage,
    amount,
    percentage,
    customerName,
    sellerName,
    gigTitle,
    totalAmount,
    isForSeller = false
  } = milestoneDetails;

  const stageLabels = {
    'order_placed': 'Order Placed',
    'accepted': 'Order Accepted',
    'in_escrow': 'Funds in Escrow',
    'delivered': 'Delivery Submitted',
    'reviewed': 'Review Submitted',
    'completed': 'Order Completed',
    'cancelled': 'Order Cancelled',
    'refunded': 'Payment Refunded'
  };

  const stageColors = {
    'order_placed': '#6B7280',
    'accepted': '#3B82F6',
    'in_escrow': '#8B5CF6',
    'delivered': '#F59E0B',
    'reviewed': '#10B981',
    'completed': '#059669',
    'cancelled': '#EF4444',
    'refunded': '#6B7280'
  };

  const stageLabel = stageLabels[stage] || stage;
  const stageColor = stageColors[stage] || '#ea581e';
  const recipientName = isForSeller ? sellerName : customerName;

  const emailSubject = `Payment Update: ${stageLabel} - Order #${orderId}`;
  const emailBody = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; background-color: #f7f7f7; margin: 0; padding: 20px; }
          .header { padding: 20px; text-align: center; }
          .header h1 { font-size: 28px; font-weight: bold; margin: 0; color: #ea581e; letter-spacing: 2px; }
          .content { margin-top: 20px; background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .milestone-badge { display: inline-block; background-color: ${stageColor}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 15px 0; }
          .payment-summary { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .payment-summary th, .payment-summary td { padding: 12px; border: 1px solid #e5e7eb; }
          .payment-summary th { background-color: #f9fafb; text-align: left; }
          .payment-summary td { text-align: right; }
          .progress-bar { background-color: #e5e7eb; border-radius: 10px; height: 20px; margin: 20px 0; overflow: hidden; }
          .progress-fill { height: 100%; background: linear-gradient(90deg, #ea581e, #f97316); transition: width 0.3s; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
          .footer a { color: #ea581e; text-decoration: none; }
          .cta-button { display: inline-block; background-color: #ea581e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>noretmy</h1>
        </div>
        <div class="content">
          <p>Dear ${recipientName},</p>
          
          <p>There's an update on the payment for your order:</p>
          
          <div style="text-align: center;">
            <span class="milestone-badge">${stageLabel}</span>
          </div>

          <table class="payment-summary">
            <tr>
              <th>Order ID</th>
              <td>#${orderId}</td>
            </tr>
            <tr>
              <th>Service</th>
              <td>${gigTitle}</td>
            </tr>
            <tr>
              <th>Milestone Amount</th>
              <td>$${amount?.toFixed(2) || '0.00'} (${percentage}%)</td>
            </tr>
            <tr>
              <th>Total Order Value</th>
              <td>$${totalAmount?.toFixed(2) || '0.00'}</td>
            </tr>
          </table>

          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%;"></div>
          </div>
          <p style="text-align: center; color: #666; font-size: 14px;">${percentage}% of payment processed</p>

          ${isForSeller ? `
            <p style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10B981;">
              💰 <strong>Funds Update:</strong> ${stage === 'completed' ? 'Funds have been released to your account!' : 'Funds are being held securely in escrow.'}
            </p>
          ` : `
            <p style="background-color: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6;">
              🔒 <strong>Payment Protected:</strong> Your payment is secured through our escrow system.
            </p>
          `}

          <div style="text-align: center;">
            <a href="https://www.noretmy.com/orders/${orderId}" class="cta-button">View Order Details</a>
          </div>

          <p style="margin-top: 20px;">If you have any questions, please contact us at <a href="mailto:support@noretmy.com">support@noretmy.com</a>.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Noretmy | All Rights Reserved</p>
          <p><a href="https://www.noretmy.com">Visit Our Website</a></p>
        </div>
      </body>
    </html>
  `;

  return sendEmailWithLogging({
    to: email,
    subject: emailSubject,
    html: emailBody,
    emailType: 'payment_milestone',
    orderId,
    recipientName,
    recipientType: isForSeller ? 'seller' : 'buyer',
    metadata: { stage, amount, percentage }
  });
};

const sendPaymentFailedEmail = async (email, paymentDetails) => {
  const {
    orderId,
    customerName,
    gigTitle,
    amount,
    errorMessage,
    paymentIntentId
  } = paymentDetails;

  const emailSubject = `Payment Failed - Order #${orderId}`;
  const emailBody = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; background-color: #f7f7f7; margin: 0; padding: 20px; }
          .header { padding: 20px; text-align: center; }
          .header h1 { font-size: 28px; font-weight: bold; margin: 0; color: #ea581e; letter-spacing: 2px; }
          .content { margin-top: 20px; background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .alert-box { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .alert-icon { font-size: 48px; text-align: center; margin-bottom: 10px; }
          .payment-details { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .payment-details th, .payment-details td { padding: 12px; border: 1px solid #e5e7eb; }
          .payment-details th { background-color: #f9fafb; text-align: left; }
          .payment-details td { text-align: right; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
          .footer a { color: #ea581e; text-decoration: none; }
          .cta-button { display: inline-block; background-color: #ea581e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 15px; }
          .help-section { background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>noretmy</h1>
        </div>
        <div class="content">
          <div class="alert-box">
            <div class="alert-icon">⚠️</div>
            <h2 style="color: #dc2626; text-align: center; margin: 0;">Payment Failed</h2>
          </div>

          <p>Dear ${customerName},</p>
          
          <p>Unfortunately, we were unable to process your payment for the following order:</p>

          <table class="payment-details">
            <tr>
              <th>Order ID</th>
              <td>#${orderId}</td>
            </tr>
            <tr>
              <th>Service</th>
              <td>${gigTitle}</td>
            </tr>
            <tr>
              <th>Amount</th>
              <td>$${amount?.toFixed(2) || '0.00'}</td>
            </tr>
            ${paymentIntentId ? `
            <tr>
              <th>Transaction ID</th>
              <td style="font-family: monospace; font-size: 12px;">${paymentIntentId}</td>
            </tr>
            ` : ''}
          </table>

          <div class="help-section">
            <h3 style="margin-top: 0;">What you can do:</h3>
            <ul>
              <li>Check if your card has sufficient funds</li>
              <li>Verify your card details are correct</li>
              <li>Try a different payment method</li>
              <li>Contact your bank if the issue persists</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <a href="https://www.noretmy.com/orders/${orderId}" class="cta-button">Try Again</a>
          </div>

          <p style="margin-top: 20px;">Need help? Contact our support team at <a href="mailto:support@noretmy.com">support@noretmy.com</a>.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Noretmy | All Rights Reserved</p>
          <p><a href="https://www.noretmy.com">Visit Our Website</a></p>
        </div>
      </body>
    </html>
  `;

  return sendEmailWithLogging({
    to: email,
    subject: emailSubject,
    html: emailBody,
    emailType: 'payment_failed',
    orderId,
    recipientName: customerName,
    recipientType: 'buyer',
    metadata: { amount, errorMessage, paymentIntentId }
  });
};

const sendOrderDeliveredEmail = async (email, deliveryDetails) => {
  const {
    orderId,
    buyerName,
    sellerName,
    gigTitle,
    deliveryMessage,
    isForBuyer = true
  } = deliveryDetails;

  const recipientName = isForBuyer ? buyerName : sellerName;
  const emailSubject = isForBuyer 
    ? `Your Order Has Been Delivered - #${orderId}`
    : `Delivery Confirmed - Order #${orderId}`;

  const emailBody = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; background-color: #f7f7f7; margin: 0; padding: 20px; }
          .header { padding: 20px; text-align: center; }
          .header h1 { font-size: 28px; font-weight: bold; margin: 0; color: #ea581e; letter-spacing: 2px; }
          .content { margin-top: 20px; background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .success-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
          .footer a { color: #ea581e; text-decoration: none; }
          .cta-button { display: inline-block; background-color: #ea581e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 10px 5px; }
          .cta-button.secondary { background-color: #6b7280; }
          .delivery-message { background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #ea581e; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>noretmy</h1>
        </div>
        <div class="content">
          <div class="success-box">
            <span style="font-size: 48px;">📦</span>
            <h2 style="color: #059669; margin: 10px 0;">Order Delivered!</h2>
          </div>

          <p>Dear ${recipientName},</p>
          
          ${isForBuyer ? `
            <p>Great news! <strong>${sellerName}</strong> has delivered your order for <strong>"${gigTitle}"</strong>.</p>
            
            ${deliveryMessage ? `
            <div class="delivery-message">
              <strong>Seller's Message:</strong>
              <p>${deliveryMessage}</p>
            </div>
            ` : ''}

            <p>Please review the delivery and take action:</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="https://www.noretmy.com/orders/${orderId}" class="cta-button">Accept Delivery</a>
              <a href="https://www.noretmy.com/orders/${orderId}?action=revision" class="cta-button secondary">Request Revision</a>
            </div>

            <p style="background-color: #fef3c7; padding: 10px; border-radius: 6px; font-size: 14px;">
              ⏰ <strong>Note:</strong> If you don't respond within 3 days, the delivery will be automatically accepted.
            </p>
          ` : `
            <p>Your delivery for order <strong>"${gigTitle}"</strong> has been submitted successfully.</p>
            <p>The buyer has been notified and will review your work shortly.</p>
            
            <div style="text-align: center;">
              <a href="https://www.noretmy.com/orders/${orderId}" class="cta-button">View Order</a>
            </div>
          `}
        </div>
        <div class="footer">
          <p>&copy; 2025 Noretmy | All Rights Reserved</p>
          <p><a href="https://www.noretmy.com">Visit Our Website</a></p>
        </div>
      </body>
    </html>
  `;

  return sendEmailWithLogging({
    to: email,
    subject: emailSubject,
    html: emailBody,
    emailType: 'order_delivered',
    orderId,
    recipientName,
    recipientType: isForBuyer ? 'buyer' : 'seller',
    metadata: { gigTitle, deliveryMessage }
  });
};

const sendOrderCompletedEmail = async (email, orderDetails) => {
  const {
    orderId,
    buyerName,
    sellerName,
    gigTitle,
    amount,
    isForSeller = false
  } = orderDetails;

  const recipientName = isForSeller ? sellerName : buyerName;
  const emailSubject = `Order Completed Successfully - #${orderId}`;

  const emailBody = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; background-color: #f7f7f7; margin: 0; padding: 20px; }
          .header { padding: 20px; text-align: center; }
          .header h1 { font-size: 28px; font-weight: bold; margin: 0; color: #ea581e; letter-spacing: 2px; }
          .content { margin-top: 20px; background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .celebration { text-align: center; padding: 30px; }
          .celebration-icon { font-size: 64px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
          .footer a { color: #ea581e; text-decoration: none; }
          .cta-button { display: inline-block; background-color: #ea581e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 10px 5px; }
          .earnings-box { background-color: #f0fdf4; border: 2px solid #10B981; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
          .earnings-amount { font-size: 36px; font-weight: bold; color: #059669; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>noretmy</h1>
        </div>
        <div class="content">
          <div class="celebration">
            <div class="celebration-icon">🎉</div>
            <h2 style="color: #059669;">Order Completed!</h2>
          </div>

          <p>Dear ${recipientName},</p>
          
          ${isForSeller ? `
            <p>Congratulations! Your order for <strong>"${gigTitle}"</strong> has been completed and approved by ${buyerName}.</p>
            
            <div class="earnings-box">
              <p style="margin: 0; color: #6b7280;">You earned</p>
              <div class="earnings-amount">$${amount?.toFixed(2) || '0.00'}</div>
              <p style="margin: 5px 0 0; color: #6b7280;">Funds will be available for withdrawal</p>
            </div>

            <div style="text-align: center;">
              <a href="https://www.noretmy.com/earnings" class="cta-button">View Earnings</a>
            </div>
          ` : `
            <p>Your order for <strong>"${gigTitle}"</strong> has been successfully completed!</p>
            <p>Thank you for using Noretmy. We hope you're satisfied with the service.</p>

            <div style="text-align: center; margin: 20px 0;">
              <a href="https://www.noretmy.com/orders/${orderId}?action=review" class="cta-button">Leave a Review</a>
            </div>

            <p>Your feedback helps other buyers and supports quality sellers on our platform.</p>
          `}
        </div>
        <div class="footer">
          <p>&copy; 2025 Noretmy | All Rights Reserved</p>
          <p><a href="https://www.noretmy.com">Visit Our Website</a></p>
        </div>
      </body>
    </html>
  `;

  return sendEmailWithLogging({
    to: email,
    subject: emailSubject,
    html: emailBody,
    emailType: 'order_completed',
    orderId,
    recipientName,
    recipientType: isForSeller ? 'seller' : 'buyer',
    metadata: { gigTitle, amount }
  });
};

const sendChatAttachmentEmail = async (email, attachmentDetails) => {
  const {
    senderName,
    recipientName,
    conversationId,
    attachmentCount,
    attachmentNames,
    orderId
  } = attachmentDetails;

  const emailSubject = `New Files Received from ${senderName}`;
  const fileList = attachmentNames?.slice(0, 5).map(name => `<li>${name}</li>`).join('') || '';
  const moreFiles = attachmentNames?.length > 5 ? `<li>...and ${attachmentNames.length - 5} more files</li>` : '';

  const emailBody = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; background-color: #f7f7f7; margin: 0; padding: 20px; }
          .header { padding: 20px; text-align: center; }
          .header h1 { font-size: 28px; font-weight: bold; margin: 0; color: #ea581e; letter-spacing: 2px; }
          .content { margin-top: 20px; background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .file-box { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .file-box ul { margin: 10px 0; padding-left: 20px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
          .footer a { color: #ea581e; text-decoration: none; }
          .cta-button { display: inline-block; background-color: #ea581e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>noretmy</h1>
        </div>
        <div class="content">
          <p>Dear ${recipientName},</p>
          
          <p><strong>${senderName}</strong> has sent you ${attachmentCount} file${attachmentCount > 1 ? 's' : ''} in your conversation.</p>

          <div class="file-box">
            <strong>📎 Files received:</strong>
            <ul>
              ${fileList}
              ${moreFiles}
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="https://www.noretmy.com/message/${conversationId}" class="cta-button">View Files</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2025 Noretmy | All Rights Reserved</p>
          <p><a href="https://www.noretmy.com">Visit Our Website</a></p>
        </div>
      </body>
    </html>
  `;

  return sendEmailWithLogging({
    to: email,
    subject: emailSubject,
    html: emailBody,
    emailType: 'chat_attachment',
    orderId,
    recipientName,
    metadata: { senderName, attachmentCount, conversationId }
  });
};

// Test email function
const sendTestEmail = async (email, testMessage = 'This is a test email from Noretmy.') => {
  const emailSubject = 'Test Email - Noretmy Email Service';
  const emailBody = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; background-color: #f7f7f7; margin: 0; padding: 20px; }
          .header { padding: 20px; text-align: center; }
          .header h1 { font-size: 28px; font-weight: bold; margin: 0; color: #ea581e; }
          .content { margin-top: 20px; background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .success { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>noretmy</h1>
        </div>
        <div class="content">
          <div class="success">
            <span style="font-size: 48px;">✅</span>
            <h2 style="color: #059669;">Email Service Working!</h2>
          </div>
          <p>${testMessage}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Noretmy | Email Service Test</p>
        </div>
      </body>
    </html>
  `;

  return sendEmailWithLogging({
    to: email,
    subject: emailSubject,
    html: emailBody,
    emailType: 'test',
    metadata: { testMessage, timestamp: new Date().toISOString() }
  });
};

module.exports = { 
  // Core utilities
  sendEmailWithLogging,
  verifyEmailConnection,
  createTransporter,
  sendTestEmail,
  
  // Authentication emails
  sendVerificationEmail,
  sendWelcomeEmail,
  sendResetPasswordEmail,
  
  // User notification emails
  sendUserNotificationEmail,
  
  // Order emails
  sendOrderSuccessEmail,
  sendSellerOrderNotificationEmail,
  sendOrderRequestEmail,
  sendOrderDeliveredEmail,
  sendOrderCompletedEmail,
  
  // Payment emails
  sendPaymentMilestoneEmail,
  sendPaymentFailedEmail,
  
  // Withdrawal emails
  sendWithdrawalStripeNotificationEmail,
  sendWithdrawalSuccessEmail,
  sendWithdrawalRejectionEmail,
  sendOnboardingEmail,
  
  // Promotion emails
  sendPromotionPlanEmail,
  sendAllGigsPromotionEmail,
  
  // Newsletter emails
  sendNewsletterWelcomeEmail,
  
  // Chat emails
  sendChatAttachmentEmail
};
