const asyncHandler = require('../utils/asyncHandler');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Payroll = require('../models/Payroll');
const Payslip = require('../models/Payslip');

// @desc    Global search across employees, departments, payroll, payslips
// @route   GET /api/search?q=
const globalSearch = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.json({ success: true, data: { employees: [], departments: [], payroll: [], payslips: [] } });
  }
  const regex = { $regex: q, $options: 'i' };

  const [employees, departments, payslips] = await Promise.all([
    Employee.find({ $or: [{ firstName: regex }, { lastName: regex }, { employeeId: regex }, { email: regex }] })
      .select('firstName lastName employeeId email')
      .limit(8),
    Department.find({ $or: [{ name: regex }, { code: regex }] }).select('name code').limit(8),
    Payslip.find({ payslipNumber: regex })
      .populate('employee', 'firstName lastName employeeId')
      .limit(8),
  ]);

  // Payroll doesn't have great text fields; match via employee name/id.
  const matchingEmployeeIds = await Employee.find({ $or: [{ firstName: regex }, { lastName: regex }, { employeeId: regex }] }).select('_id');
  const payroll = await Payroll.find({ employee: { $in: matchingEmployeeIds.map((e) => e._id) } })
    .populate('employee', 'firstName lastName employeeId')
    .sort({ year: -1, month: -1 })
    .limit(8);

  res.json({ success: true, data: { employees, departments, payroll, payslips } });
});

module.exports = { globalSearch };
