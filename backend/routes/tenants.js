// routes/tenants.js
const express = require('express');
const router = express.Router();
const { getAllTenants, createTenant, getTenant, updateTenant, suspendTenant, deleteTenant, addStaff, getStaff } = require('../controllers/tenantController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);
router.get('/', restrictTo('SuperAdmin'), getAllTenants);
router.post('/', restrictTo('SuperAdmin'), createTenant);
router.get('/:id', restrictTo('SuperAdmin', 'OrgAdmin'), getTenant);
router.patch('/:id', restrictTo('SuperAdmin'), updateTenant);
router.patch('/:id/suspend', restrictTo('SuperAdmin'), suspendTenant);
router.delete('/:id', restrictTo('SuperAdmin'), deleteTenant);
router.post('/:id/staff', restrictTo('SuperAdmin', 'OrgAdmin'), addStaff);
router.get('/:id/staff', restrictTo('SuperAdmin', 'OrgAdmin'), getStaff);

module.exports = router;
