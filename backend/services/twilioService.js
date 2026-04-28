const twilio = require('twilio');

let client = null;
let verifyServiceSid = null;

// Initialize Twilio client (lazy initialization)
function getClient() {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !authToken || !verifyServiceSid) {
      console.warn('⚠️  Twilio credentials not configured. Running in TEST MODE.');
      return null;
    }

    client = twilio(accountSid, authToken);
  }
  return client;
}

/**
 * Send OTP to phone number via Twilio Verify
 * Falls back to console log in test mode
 */
async function sendOTP(phoneNumber) {
  const twilioClient = getClient();

  if (!twilioClient) {
    // TEST MODE: Generate a fixed OTP for development
    const testOTP = '123456';
    console.log(`\n🔐 [CivicShield] OTP for ${phoneNumber}: ${testOTP}\n`);
    return {
      success: true,
      testMode: true,
      message: `[CivicShield] OTP is: ${testOTP}`,
      testOTP,
    };
  }

  try {
    await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms',
      });

    return { success: true, testMode: false, message: `OTP sent to ${phoneNumber}` };
  } catch (error) {
    console.error('Twilio sendOTP error:', error.message);
    throw new Error('Failed to send OTP. Please check your phone number and try again.');
  }
}

/**
 * Verify OTP code
 * In test mode, accepts '123456' as valid
 */
async function verifyOTP(phoneNumber, code) {
  const twilioClient = getClient();

  if (!twilioClient) {
    // TEST MODE
    if (code === '123456') {
      return { success: true, valid: true };
    }
    return { success: false, valid: false, message: 'Invalid OTP. In test mode, use: 123456' };
  }

  try {
    const result = await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code: String(code),
      });

    return {
      success: true,
      valid: result.status === 'approved',
    };
  } catch (error) {
    console.error('Twilio verifyOTP error:', error.message);
    throw new Error('OTP verification failed. Please try again.');
  }
}

module.exports = { sendOTP, verifyOTP };
