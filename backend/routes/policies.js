const express = require('express');
const router = express.Router();
const { getPolicies, createPolicy, updatePolicy, deletePolicy } = require('../controllers/policyController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', protect, getPolicies);
router.post('/', protect, restrictTo('SuperAdmin', 'OrgAdmin'), createPolicy);
router.patch('/:id', protect, restrictTo('SuperAdmin', 'OrgAdmin'), updatePolicy);
router.delete('/:id', protect, restrictTo('SuperAdmin', 'OrgAdmin'), deletePolicy);

module.exports = router;
