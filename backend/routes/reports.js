const express = require('express');
const router = express.Router();
const {
  submitReport, getAllReports, getReport, updateReportStatus,
  trackReport, getMyReports, uploadEvidence
} = require('../controllers/reportController');
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');

// Public routes
router.post('/', optionalAuth, submitReport);
router.get('/track/:trackingId', trackReport);

// Reporter routes
router.get('/my', protect, restrictTo('Reporter'), getMyReports);

// Admin routes
router.get('/', protect, restrictTo('SuperAdmin', 'OrgAdmin', 'Investigator'), getAllReports);
router.get('/:id', protect, restrictTo('SuperAdmin', 'OrgAdmin', 'Investigator'), getReport);
router.patch('/:id/status', protect, restrictTo('SuperAdmin', 'OrgAdmin', 'Investigator'), updateReportStatus);
router.post('/evidence/:id', optionalAuth, uploadEvidence);

module.exports = router;
