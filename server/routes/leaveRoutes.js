const express = require('express');
const { protect, authorize, restrictEmployeeSelf } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { getLeaves, applyLeave, approveLeave, rejectLeave } = require('../controllers/leaveController');

const router = express.Router();
const { ADMIN, PAYROLL_MANAGER } = ROLES;

router.use(protect);

router.get('/', restrictEmployeeSelf('query.employee'), getLeaves);
router.post('/', applyLeave); // any authenticated user can apply for their own leave
router.put('/:id/approve', authorize(ADMIN, PAYROLL_MANAGER), approveLeave);
router.put('/:id/reject', authorize(ADMIN, PAYROLL_MANAGER), rejectLeave);

module.exports = router;
