const express = require('express');
const { protect, authorize, restrictEmployeeSelf } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { getPayslips, getPayslip, generatePayslip, downloadPayslipPDF } = require('../controllers/payslipController');

const router = express.Router();
const { ADMIN, PAYROLL_MANAGER } = ROLES;

router.use(protect);

router.get('/', restrictEmployeeSelf('query.employee'), getPayslips);
router.get('/:id', getPayslip);
router.get('/:id/pdf', downloadPayslipPDF);
router.post('/generate/:payrollId', authorize(ADMIN, PAYROLL_MANAGER), generatePayslip);

module.exports = router;
