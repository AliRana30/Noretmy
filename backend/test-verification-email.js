/**
 * Test Verification Email Specifically
 */
require('dotenv').config();
const { sendVerificationEmail } = require('./services/emailService');

const testVerificationEmail = async () => {
  console.log('📧 Testing Verification Email...\n');
  
  const testEmail = process.env.SMTP_MAIL || 'alimahmoodrana28@gmail.com';
  const testToken = 'test-token-' + Date.now();
  
  console.log('Sending to:', testEmail);
  console.log('Token:', testToken);
  console.log('');
  
  try {
    await sendVerificationEmail(testEmail, testToken);
    console.log('✅ Verification email sent!');
    console.log('📬 Check your inbox and SPAM folder');
    console.log('');
    console.log('Subject: "Email Verification - Noretmy"');
    console.log('From: "Noretmy <noreply@noretmy.com>"');
    console.log('');
  } catch (error) {
    console.error('❌ Failed:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
};

testVerificationEmail();
