const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// @desc    List/query attendance records (daily, monthly, by employee)
// @route   GET /api/attendance
const getAttendance = asyncHandler(async (req, res) => {
  const { employee, date, month, year, department, status, page = 1, limit = 31 } = req.query;
  const query = {};
  if (employee) query.employee = employee;
  if (status) query.status = status;

  if (date) {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    query.date = { $gte: start, $lte: end };
  } else if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
    query.date = { $gte: start, $lte: end };
  }

  let employeeFilter = null;
  if (department) {
    employeeFilter = await Employee.find({ department }).select('_id');
    query.employee = { $in: employeeFilter.map((e) => e._id) };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(1000, parseInt(limit, 10) || 31));

  const [records, total] = await Promise.all([
    Attendance.find(query)
      .populate({ path: 'employee', select: 'firstName lastName employeeId department', populate: { path: 'department', select: 'name' } })
      .sort({ date: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Attendance.countDocuments(query),
  ]);

  res.json({ success: true, data: records, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 } });
});

// @desc    Mark/create attendance for one employee on one date (upsert)
// @route   POST /api/attendance
const markAttendance = asyncHandler(async (req, res) => {
  const { employee, date, status, checkIn, checkOut, overtimeHours, remarks } = req.body;
  if (!employee || !date || !status) {
    throw new ApiError(400, 'employee, date, and status are required.');
  }

  const empDoc = await Employee.findById(employee);
  if (!empDoc) throw new ApiError(404, 'Employee not found.');

  const d = new Date(date);
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const record = await Attendance.findOneAndUpdate(
    { employee, date: dayStart },
    {
      employee,
      date: dayStart,
      status,
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      overtimeHours: overtimeHours || 0,
      remarks: remarks || '',
      markedBy: req.user._id,
    },
    { upsert: true, new: true, runValidators: true }
  );

  res.status(201).json({ success: true, data: record });
});

// @desc    Bulk mark attendance for multiple employees on the same date
// @route   POST /api/attendance/bulk
const bulkMarkAttendance = asyncHandler(async (req, res) => {
  const { date, records } = req.body; // records: [{ employee, status, overtimeHours, remarks }]
  if (!date || !Array.isArray(records) || records.length === 0) {
    throw new ApiError(400, 'date and a non-empty records array are required.');
  }
  const d = new Date(date);
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const results = await Promise.all(
    records.map((r) =>
      Attendance.findOneAndUpdate(
        { employee: r.employee, date: dayStart },
        {
          employee: r.employee,
          date: dayStart,
          status: r.status,
          overtimeHours: r.overtimeHours || 0,
          remarks: r.remarks || '',
          markedBy: req.user._id,
        },
        { upsert: true, new: true, runValidators: true }
      )
    )
  );

  res.status(201).json({ success: true, data: results });
});

// @desc    Update a single attendance record
// @route   PUT /api/attendance/:id
const updateAttendance = asyncHandler(async (req, res) => {
  const record = await Attendance.findById(req.params.id);
  if (!record) throw new ApiError(404, 'Attendance record not found.');

  const { status, checkIn, checkOut, overtimeHours, remarks } = req.body;
  if (status) record.status = status;
  if (checkIn !== undefined) record.checkIn = checkIn;
  if (checkOut !== undefined) record.checkOut = checkOut;
  if (overtimeHours !== undefined) record.overtimeHours = overtimeHours;
  if (remarks !== undefined) record.remarks = remarks;
  record.markedBy = req.user._id;

  await record.save();
  res.json({ success: true, data: record });
});

// @desc    Attendance statistics for an employee (or company-wide) for a month
// @route   GET /api/attendance/stats
const getAttendanceStats = asyncHandler(async (req, res) => {
  const { employee, month, year } = req.query;
  const now = new Date();
  const m = Number(month) || now.getMonth() + 1;
  const y = Number(year) || now.getFullYear();
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);

  const match = { date: { $gte: start, $lte: end } };
  if (employee) match.employee = new (require('mongoose').Types.ObjectId)(employee);

  const agg = await Attendance.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 }, overtimeHours: { $sum: '$overtimeHours' } } },
  ]);

  const stats = { present: 0, absent: 0, halfDay: 0, leave: 0, late: 0, overtimeHours: 0 };
  const keyMap = { Present: 'present', Absent: 'absent', 'Half Day': 'halfDay', Leave: 'leave', Late: 'late' };
  agg.forEach((a) => {
    const key = keyMap[a._id];
    if (key) stats[key] = a.count;
    stats.overtimeHours += a.overtimeHours || 0;
  });

  res.json({ success: true, data: stats });
});

module.exports = { getAttendance, markAttendance, bulkMarkAttendance, updateAttendance, getAttendanceStats };
