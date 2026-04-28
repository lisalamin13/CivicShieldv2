const express = require('express');
const router = express.Router();
const { getMyStaff, updateStaff, toggleStaff, deleteStaff } = require('../controllers/staffController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);
router.get('/', restrictTo('SuperAdmin', 'OrgAdmin'), getMyStaff);
router.patch('/:id', restrictTo('SuperAdmin', 'OrgAdmin'), updateStaff);
router.patch('/:id/toggle', restrictTo('SuperAdmin', 'OrgAdmin'), toggleStaff);
router.delete('/:id', restrictTo('SuperAdmin', 'OrgAdmin'), deleteStaff);

module.exports = router;