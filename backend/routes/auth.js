// routes/auth.js
const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtpAndLogin, reporterLogin, reporterRegister, getMe, updateProfile, uploadAvatar } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpAndLogin);
router.post('/reporter-login', reporterLogin);
router.post('/reporter-register', reporterRegister);
router.get('/me', protect, getMe);
router.patch('/update-profile', protect, updateProfile); 
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;
