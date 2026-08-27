const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { getDashboardData } = require('../controllers/dashboardController');

const router = express.Router();

router.use(protect);
router.get('/', authorize(ROLES.ADMIN, ROLES.PAYROLL_MANAGER), getDashboardData);

module.exports = router;
