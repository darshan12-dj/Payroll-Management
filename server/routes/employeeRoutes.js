const express = require('express');
const { body } = require('express-validator');
const { protect, authorize, restrictEmployeeSelf } = require('../middleware/auth');
const validate = require('../middleware/validate');
const uploadPhoto = require('../middleware/upload');
const { ROLES } = require('../config/constants');
const {
  getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee,
  getEmployeeAttendance, getEmployeePayrollHistory,
} = require('../controllers/employeeController');

const router = express.Router();
const { ADMIN, PAYROLL_MANAGER } = ROLES;

const employeeValidators = [
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('email').isEmail().withMessage('A valid email is required.'),
  body('phone').trim().notEmpty().withMessage('Phone number is required.'),
  body('department').notEmpty().withMessage('Department is required.'),
  body('position').trim().notEmpty().withMessage('Position is required.'),
  body('basicSalary').isFloat({ min: 0 }).withMessage('Basic salary must be a positive number.'),
];

router.use(protect);

router.get('/', authorize(ADMIN, PAYROLL_MANAGER), getEmployees);
// An "employee" caller may only ever fetch their own linked record.
router.get('/:id', restrictEmployeeSelf('params.id'), getEmployee);
router.get('/:id/attendance', restrictEmployeeSelf('params.id'), getEmployeeAttendance);
router.get('/:id/payroll', restrictEmployeeSelf('params.id'), getEmployeePayrollHistory);

router.post('/', authorize(ADMIN), uploadPhoto.single('profilePhoto'), employeeValidators, validate, createEmployee);
router.put('/:id', authorize(ADMIN), uploadPhoto.single('profilePhoto'), updateEmployee);
router.delete('/:id', authorize(ADMIN), deleteEmployee);

module.exports = router;
