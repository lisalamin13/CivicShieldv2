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

    return {
      success: true,
      testMode: true,
      testOTP: '123456',
      message: `OTP sent to ${phoneNumber}. Demo OTP '123456' also works.`,
    };
  } catch (error) {
    console.warn('Twilio sendOTP error:', error.message);
    // FALLBACK: If Twilio fails (e.g. invalid credentials or number), still allow demo OTP
    return {
      success: true,
      testMode: true,
      testOTP: '123456',
      message: `[DEMO MODE] SMS failed to send, but you can use bypass OTP: 123456`,
    };
  }
}

/**
 * Verify OTP code
 * Always accepts '123456' as valid (Demo Bypass)
 */
async function verifyOTP(phoneNumber, code) {
  console.log(`Checking OTP for ${phoneNumber}: [${code}]`);
  // 🔓 DEMO BYPASS: Always allow '123456'
  if (String(code) === '123456') {
    console.log(`🔓 [CivicShield] Demo bypass used for ${phoneNumber}`);
    return { success: true, valid: true };
  }

  const twilioClient = getClient();
  if (!twilioClient) {
    return { success: false, valid: false, message: 'Invalid OTP. In test mode, use: 123456' };
  }

  try {
    const result = await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code: String(code),
      });

    console.log(`Twilio verification status for ${phoneNumber}: ${result.status}`);
    return {
      success: true,
      valid: result.status === 'approved',
    };
  } catch (error) {
    console.warn('Twilio verifyOTP error:', error.message);
    // If it's a "not found" error, it just means the OTP is wrong/expired
    if (error.message.includes('not found') || error.message.includes('expired')) {
      return { success: true, valid: false };
    }
    // For other errors (like config issues), we still want to know but maybe allow bypass if user already tried
    return { success: false, valid: false, error: error.message };
  }
}

module.exports = { sendOTP, verifyOTP };
