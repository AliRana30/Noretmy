/**
 * Email Service Test & Debug Utility
 * Run this to test email configuration
 */

const test = async () => {
  console.log('🧪 Testing Email Configuration...\n');
  
  console.log('📋 Environment Variables:');
  console.log('  SMTP_HOST:', process.env.SMTP_HOST || '❌ NOT SET');
  console.log('  SMTP_PORT:', process.env.SMTP_PORT || '❌ NOT SET');
  console.log('  SMTP_MAIL:', process.env.SMTP_MAIL ? '✅ SET' : '❌ NOT SET');
  console.log('  SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ SET (hidden)' : '❌ NOT SET');
  console.log('  SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ SET (hidden)' : '❌ NOT SET');
  console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || '❌ NOT SET');
  console.log('');

  const usingSendGrid = !!process.env.SENDGRID_API_KEY;
  console.log('📧 Service Detected:', usingSendGrid ? 'SendGrid (Production)' : 'SMTP/Gmail (Local)');
  console.log('');

  if (usingSendGrid) {
    console.log('🔄 Testing SendGrid...');
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    try {
      await sgMail.send({
        to: process.env.SMTP_MAIL || 'test@example.com',
        from: process.env.EMAIL_FROM || process.env.SMTP_MAIL,
        subject: 'SendGrid Test Email',
        html: '<h1>✅ SendGrid is working!</h1><p>This is a test email from your Noretmy backend.</p>'
      });
      console.log('✅ SendGrid test email sent successfully!');
      console.log('📬 Check inbox:', process.env.SMTP_MAIL);
    } catch (error) {
      console.error('❌ SendGrid failed:', error.message);
      if (error.code === 403) {
        console.log('\n⚠️  FIX: Verify sender email in SendGrid dashboard');
        console.log('   https://app.sendgrid.com/settings/sender_auth/senders');
      }
    }
  } else {
    console.log('🔄 Testing SMTP/Gmail...');
    const nodemailer = require('nodemailer');
    
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_MAIL,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await transporter.verify();
      console.log('✅ SMTP connection verified!');

      await transporter.sendMail({
        from: `"Noretmy Test" <${process.env.SMTP_MAIL}>`,
        to: process.env.SMTP_MAIL,
        subject: 'SMTP Test Email',
        html: '<h1>✅ SMTP is working!</h1><p>This is a test email from your Noretmy backend.</p>'
      });
      console.log('✅ SMTP test email sent successfully!');
      console.log('📬 Check inbox:', process.env.SMTP_MAIL);
    } catch (error) {
      console.error('❌ SMTP failed:', error.message);
      if (error.code === 'EAUTH') {
        console.log('\n⚠️  FIX: Gmail app password is invalid or expired');
        console.log('   1. Go to: https://myaccount.google.com/apppasswords');
        console.log('   2. Delete old password');
        console.log('   3. Create new app password');
        console.log('   4. Update SMTP_PASSWORD in .env');
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
        console.log('\n⚠️  FIX: Connection timeout - try port 587 instead');
        console.log('   Update .env: SMTP_PORT=587');
        console.log('   Update .env: SMTP_SECURE=false');
      }
    }
  }

  console.log('\n✅ Test complete!');
  process.exit(0);
};

if (require.main === module) {
  require('dotenv').config();
  test().catch(console.error);
}

module.exports = { test };
