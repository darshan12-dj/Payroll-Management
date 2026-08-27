const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { getReport, exportReport } = require('../controllers/reportController');

const router = express.Router();

router.use(protect);
router.get('/:type', authorize(ROLES.ADMIN, ROLES.PAYROLL_MANAGER), getReport);
router.get('/:type/export', authorize(ROLES.ADMIN, ROLES.PAYROLL_MANAGER), exportReport);

module.exports = router;
