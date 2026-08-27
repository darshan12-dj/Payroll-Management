const express = require('express');
const { protect, authorize, restrictEmployeeSelf } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  getAttendance, markAttendance, bulkMarkAttendance, updateAttendance, getAttendanceStats,
} = require('../controllers/attendanceController');

const router = express.Router();
const { ADMIN, PAYROLL_MANAGER } = ROLES;

router.use(protect);

router.get('/', restrictEmployeeSelf('query.employee'), getAttendance);
router.get('/stats', restrictEmployeeSelf('query.employee'), getAttendanceStats);
router.post('/', authorize(ADMIN, PAYROLL_MANAGER), markAttendance);
router.post('/bulk', authorize(ADMIN, PAYROLL_MANAGER), bulkMarkAttendance);
router.put('/:id', authorize(ADMIN, PAYROLL_MANAGER), updateAttendance);

module.exports = router;
