const jwt = require('jsonwebtoken');
const StaffUser = require('../models/StaffUser');
const Reporter = require('../models/Reporter');
const Tenant = require('../models/Tenant');
const { sendOTP, verifyOTP } = require('../services/twilioService');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/send-otp
// Send OTP to a staff phone number (validates phone exists first)
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required.' });

    const user = await StaffUser.findOne({ phone });
    if (!user) return res.status(404).json({ error: 'No admin account found with this phone number.' });
    if (!user.isActive) return res.status(403).json({ error: 'This account is inactive.' });

    const result = await sendOTP(phone);
    return res.json({
      success: true,
      message: result.message,
      testMode: result.testMode || false,
      ...(result.testOTP && { testOTP: result.testOTP }),
    });
  } catch (error) {
    console.error('sendOtp error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/auth/verify-otp
// Verify OTP + password for staff (SuperAdmin / OrgAdmin)
exports.verifyOtpAndLogin = async (req, res) => {
  try {
    const { phone, otp, password } = req.body;
    if (!phone || !otp || !password)
      return res.status(400).json({ error: 'Phone, OTP, and password are required.' });

    // Verify OTP
    const otpResult = await verifyOTP(phone, otp);
    if (!otpResult.valid)
      return res.status(401).json({ error: 'Invalid or expired OTP.' });

    // Verify password
    const user = await StaffUser.findOne({ phone }).populate('tenantId');
    if (!user) return res.status(404).json({ error: 'Account not found.' });

    const isMatch = await user.comparePassword(password);
    console.log(`Password match for ${phone}: ${isMatch}`);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect password.' });

    if (!user.isActive) return res.status(403).json({ error: 'Account is inactive.' });
    if (user.tenantId?.isSuspended && user.role !== 'SuperAdmin')
      return res.status(403).json({ error: 'Your organization account has been suspended.' });

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken({
      id: user._id,
      role: user.role,
      tenantId: user.tenantId?._id || user.tenantId,
      userType: 'staff',
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        tenantId: user.tenantId?._id || user.tenantId,
        orgName: user.tenantId?.orgName,
      },
    });
  } catch (error) {
    console.error('verifyOtpAndLogin error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/auth/reporter-login
// Direct login for reporters (no OTP)
exports.reporterLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ error: 'Phone and password are required.' });

    const reporter = await Reporter.findOne({ phone });
    if (!reporter) return res.status(404).json({ error: 'No reporter account found with this phone number.' });

    const isMatch = await reporter.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect password.' });

    if (!reporter.isActive) return res.status(403).json({ error: 'Account is inactive.' });

    reporter.lastLogin = new Date();
    await reporter.save({ validateBeforeSave: false });

    const token = signToken({
      id: reporter._id,
      role: 'Reporter',
      userType: 'reporter',
    });

    return res.json({
      success: true,
      token,
      user: {
        id: reporter._id,
        name: reporter.name,
        phone: reporter.phone,
        role: 'Reporter',
      },
    });
  } catch (error) {
    console.error('reporterLogin error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/auth/reporter-register
exports.reporterRegister = async (req, res) => {
  try {
    const { phone, password, name, email } = req.body;
    if (!phone || !password)
      return res.status(400).json({ error: 'Phone and password are required.' });

    const existing = await Reporter.findOne({ phone });
    if (existing) return res.status(409).json({ error: 'An account with this phone number already exists.' });

    const reporter = await Reporter.create({ phone, passwordHash: password, name, email });

    const token = signToken({ id: reporter._id, role: 'Reporter', userType: 'reporter' });

    return res.status(201).json({
      success: true,
      token,
      user: { id: reporter._id, name: reporter.name, phone: reporter.phone, role: 'Reporter' },
    });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ error: 'Phone or email already in use.' });
    res.status(500).json({ error: error.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    let user;
    if (req.user.userType === 'staff') {
      user = await StaffUser.findById(req.user.id).populate('tenantId', 'orgName organizationId sectorType');
    } else {
      user = await Reporter.findById(req.user.id);
    }
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/auth/update-profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, department, currentPassword, newPassword } = req.body;

    let user;
    if (req.user.userType === 'staff') {
      user = await StaffUser.findById(req.user.id);
    } else {
      user = await Reporter.findById(req.user.id);
    }

    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Update basic fields
    if (name) user.name = name.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (department !== undefined && req.user.userType === 'staff') user.department = department;

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password.' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters.' });
      }
      user.passwordHash = newPassword; // pre-save hook will hash it
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || 'Reporter',
        department: user.department,
        profileImage: user.profileImage
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email is already in use by another account.' });
    }
    res.status(500).json({ error: error.message });
  }
};

// POST /api/auth/upload-avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided.' });

    const { stripMetadata } = require('../middleware/upload');
    await stripMetadata(req.file.path, req.file.mimetype);

    let user;
    if (req.user.userType === 'staff') {
      user = await StaffUser.findById(req.user.id);
    } else {
      user = await Reporter.findById(req.user.id);
    }

    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Update profile image path
    user.profileImage = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully.',
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('uploadAvatar error:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/auth/reset-password-otp
exports.resetPasswordOtp = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;
    if (!phone || !otp || !newPassword)
      return res.status(400).json({ error: 'Phone, OTP, and new password are required.' });

    // Verify OTP
    const { verifyOTP } = require('../services/twilioService');
    const otpResult = await verifyOTP(phone, otp);
    if (!otpResult.valid)
      return res.status(401).json({ error: 'Invalid or expired OTP.' });

    // Find staff user
    const user = await StaffUser.findOne({ phone });
    if (!user) return res.status(404).json({ error: 'No admin account found with this phone number.' });

    // Update password
    user.password = newPassword;
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset successfully! Please log in using your new password.',
    });
  } catch (error) {
    console.error('resetPasswordOtp error:', error.message);
    res.status(500).json({ error: error.message });
  }
};