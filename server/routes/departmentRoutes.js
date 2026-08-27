const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const {
  getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment,
} = require('../controllers/departmentController');

const router = express.Router();
const { ADMIN } = ROLES;

router.use(protect);

router.get('/', getDepartments);
router.get('/:id', getDepartment);

router.post(
  '/',
  authorize(ADMIN),
  [body('name').trim().notEmpty().withMessage('Department name is required.'), body('code').trim().notEmpty().withMessage('Department code is required.')],
  validate,
  createDepartment
);
router.put('/:id', authorize(ADMIN), updateDepartment);
router.delete('/:id', authorize(ADMIN), deleteDepartment);

module.exports = router;
