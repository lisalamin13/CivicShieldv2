const express = require('express');
const router = express.Router();
const { getAnalytics, getGlobalAnalytics } = require('../controllers/analyticsController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', protect, restrictTo('SuperAdmin', 'OrgAdmin', 'Investigator'), getAnalytics);
router.get('/global', protect, restrictTo('SuperAdmin'), getGlobalAnalytics);

module.exports = router;
