const express = require('express');
const router = express.Router();
const { submitInquiry, getAllInquiries, updateInquiryStatus } = require('../controllers/inquiryController');
const { protect, restrictTo } = require('../middleware/auth');

// Public: Submit inquiry
router.post('/', submitInquiry);

// Admin: Manage inquiries
router.get('/', protect, restrictTo('SuperAdmin'), getAllInquiries);
router.patch('/:id', protect, restrictTo('SuperAdmin'), updateInquiryStatus);

module.exports = router;
