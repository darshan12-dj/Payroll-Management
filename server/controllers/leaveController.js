const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { notifyUser, notifyUsers } = require('../utils/notify');
const { ROLES } = require('../config/constants');

function calcDays(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

// @desc    List leave requests (filterable)
// @route   GET /api/leaves
const getLeaves = asyncHandler(async (req, res) => {
  const { employee, status, leaveType, page = 1, limit = 20 } = req.query;
  const query = {};
  if (employee) query.employee = employee;
  if (status) query.status = status;
  if (leaveType) query.leaveType = leaveType;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

  const [data, total] = await Promise.all([
    Leave.find(query)
      .populate({ path: 'employee', select: 'firstName lastName employeeId department', populate: { path: 'department', select: 'name' } })
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Leave.countDocuments(query),
  ]);

  res.json({ success: true, data, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 } });
});

// @desc    Apply for leave
// @route   POST /api/leaves
const applyLeave = asyncHandler(async (req, res) => {
  const { employee, leaveType, startDate, endDate, reason } = req.body;
  if (!employee || !leaveType || !startDate || !endDate || !reason) {
    throw new ApiError(400, 'employee, leaveType, startDate, endDate, and reason are required.');
  }
  if (new Date(endDate) < new Date(startDate)) {
    throw new ApiError(400, 'End date cannot be before start date.');
  }

  const empDoc = await Employee.findById(employee);
  if (!empDoc) throw new ApiError(404, 'Employee not found.');

  const days = calcDays(startDate, endDate);
  const leave = await Leave.create({ employee, leaveType, startDate, endDate, days, reason });

  const notifyTargets = await User.find({ role: { $in: [ROLES.ADMIN, ROLES.PAYROLL_MANAGER] } }).select('_id');
  await notifyUsers(
    notifyTargets.map((u) => u._id),
    {
      title: 'New leave request',
      message: `${empDoc.firstName} ${empDoc.lastName} requested ${days} day(s) of ${leaveType}.`,
      type: 'leave_applied',
      link: `/leave`,
    }
  );

  res.status(201).json({ success: true, data: leave });
});

// @desc    Approve a leave request
// @route   PUT /api/leaves/:id/approve
const approveLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id).populate('employee', 'firstName lastName user');
  if (!leave) throw new ApiError(404, 'Leave request not found.');
  if (leave.status !== 'Pending') throw new ApiError(400, `This leave request is already ${leave.status.toLowerCase()}.`);

  leave.status = 'Approved';
  leave.approvedBy = req.user._id;
  leave.actionDate = new Date();
  leave.remarks = req.body.remarks || leave.remarks;
  await leave.save();

  if (leave.employee?.user) {
    await notifyUser(leave.employee.user, {
      title: 'Leave request approved',
      message: `Your ${leave.leaveType} request (${leave.days} day(s)) has been approved.`,
      type: 'leave_approved',
      link: '/leave',
    });
  }

  res.json({ success: true, data: leave });
});

// @desc    Reject a leave request
// @route   PUT /api/leaves/:id/reject
const rejectLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id).populate('employee', 'firstName lastName user');
  if (!leave) throw new ApiError(404, 'Leave request not found.');
  if (leave.status !== 'Pending') throw new ApiError(400, `This leave request is already ${leave.status.toLowerCase()}.`);

  leave.status = 'Rejected';
  leave.approvedBy = req.user._id;
  leave.actionDate = new Date();
  leave.remarks = req.body.remarks || leave.remarks;
  await leave.save();

  if (leave.employee?.user) {
    await notifyUser(leave.employee.user, {
      title: 'Leave request rejected',
      message: `Your ${leave.leaveType} request (${leave.days} day(s)) has been rejected.`,
      type: 'leave_rejected',
      link: '/leave',
    });
  }

  res.json({ success: true, data: leave });
});

module.exports = { getLeaves, applyLeave, approveLeave, rejectLeave };
