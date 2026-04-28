// routes/auth.js
const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtpAndLogin, reporterLogin, reporterRegister, getMe, updateProfile} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpAndLogin);
router.post('/reporter-login', reporterLogin);
router.post('/reporter-register', reporterRegister);
router.get('/me', protect, getMe);
router.patch('/update-profile', protect, updateProfile); 

module.exports = router;
