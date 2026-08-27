const express = require('express');
const { protect, authorize, restrictEmployeeSelf } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  getSalaryStructures, getSalaryStructureForEmployee, upsertSalaryStructure, previewCalculation,
} = require('../controllers/salaryStructureController');

const router = express.Router();
const { ADMIN, PAYROLL_MANAGER } = ROLES;

router.use(protect);

router.get('/', authorize(ADMIN, PAYROLL_MANAGER), getSalaryStructures);
router.post('/preview', authorize(ADMIN, PAYROLL_MANAGER), previewCalculation);
router.get('/:employeeId', restrictEmployeeSelf('params.employeeId'), getSalaryStructureForEmployee);
router.post('/', authorize(ADMIN), upsertSalaryStructure);

module.exports = router;
