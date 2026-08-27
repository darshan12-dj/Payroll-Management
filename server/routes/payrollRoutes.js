const express = require('express');
const { protect, authorize, restrictEmployeeSelf } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  calculatePayrollPreview, processPayroll, getPayrolls, getPayroll, markPaid,
} = require('../controllers/payrollController');

const router = express.Router();
const { ADMIN, PAYROLL_MANAGER } = ROLES;

router.use(protect);

router.get('/', restrictEmployeeSelf('query.employee'), getPayrolls);
router.get('/:id', getPayroll);
router.post('/calculate', authorize(ADMIN, PAYROLL_MANAGER), calculatePayrollPreview);
router.post('/process', authorize(ADMIN, PAYROLL_MANAGER), processPayroll);
router.put('/:id/mark-paid', authorize(ADMIN), markPaid);

module.exports = router;
