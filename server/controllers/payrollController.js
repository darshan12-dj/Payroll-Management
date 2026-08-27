const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const SalaryStructure = require('../models/SalaryStructure');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { calculatePayroll } = require('../services/payrollCalculator');
const { getMonthlyAttendanceSummary } = require('../services/attendanceService');
const { notifyUser, notifyUsers } = require('../utils/notify');
const { ROLES } = require('../config/constants');

async function buildPreviewForEmployee(employee, month, year, workingDaysPerMonth) {
  const structure = await SalaryStructure.findOne({ employee: employee._id, isActive: true });
  if (!structure) {
    return {
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        department: employee.department,
      },
      error: 'No active salary structure configured for this employee.',
    };
  }

  const attendanceSummary = await getMonthlyAttendanceSummary(employee._id, month, year, workingDaysPerMonth);
  const calc = calculatePayroll({ salaryStructure: structure, attendanceSummary });

  return {
    employee: {
      _id: employee._id,
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      department: employee.department,
    },
    ...calc,
  };
}

// @desc    Calculate (preview) payroll for one/many employees without saving
// @route   POST /api/payroll/calculate
const calculatePayrollPreview = asyncHandler(async (req, res) => {
  const { month, year, employee, department } = req.body;
  if (!month || !year) throw new ApiError(400, 'month and year are required.');

  const settings = await Settings.getSingleton();
  const workingDaysPerMonth = settings.payrollSettings.workingDaysPerMonth;

  const query = { isActive: true };
  if (employee) query._id = employee;
  if (department) query.department = department;

  const employees = await Employee.find(query).populate('department', 'name');
  if (employees.length === 0) throw new ApiError(404, 'No matching active employees found.');

  const existingPayrolls = await Payroll.find({
    month,
    year,
    employee: { $in: employees.map((e) => e._id) },
  }).select('employee status');
  const alreadyProcessed = new Set(existingPayrolls.map((p) => String(p.employee)));

  const previews = await Promise.all(
    employees.map(async (emp) => {
      const preview = await buildPreviewForEmployee(emp, month, year, workingDaysPerMonth);
      return {
        ...preview,
        alreadyProcessed: alreadyProcessed.has(String(emp._id)),
      };
    })
  );

  res.json({ success: true, data: previews, month, year });
});

// @desc    Process (save) payroll for one or more employees for a month/year
// @route   POST /api/payroll/process
const processPayroll = asyncHandler(async (req, res) => {
  const { month, year, employeeIds, department } = req.body;
  if (!month || !year) throw new ApiError(400, 'month and year are required.');

  const settings = await Settings.getSingleton();
  const workingDaysPerMonth = settings.payrollSettings.workingDaysPerMonth;

  const query = { isActive: true };
  if (Array.isArray(employeeIds) && employeeIds.length > 0) query._id = { $in: employeeIds };
  if (department) query.department = department;

  const employees = await Employee.find(query).populate('department', 'name');
  if (employees.length === 0) throw new ApiError(404, 'No matching active employees found.');

  const results = { processed: [], skipped: [] };

  for (const emp of employees) {
    // Prevent duplicate payroll processing for the same employee and month.
    // eslint-disable-next-line no-await-in-loop
    const existing = await Payroll.findOne({ employee: emp._id, month, year });
    if (existing) {
      results.skipped.push({ employee: emp.employeeId, reason: `Payroll for ${month}/${year} already ${existing.status.toLowerCase()}.` });
      // eslint-disable-next-line no-continue
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const structure = await SalaryStructure.findOne({ employee: emp._id, isActive: true });
    if (!structure) {
      results.skipped.push({ employee: emp.employeeId, reason: 'No active salary structure configured.' });
      // eslint-disable-next-line no-continue
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const attendanceSummary = await getMonthlyAttendanceSummary(emp._id, month, year, workingDaysPerMonth);
    const calc = calculatePayroll({ salaryStructure: structure, attendanceSummary });

    try {
      // eslint-disable-next-line no-await-in-loop
      const payroll = await Payroll.create({
        employee: emp._id,
        department: emp.department._id,
        month,
        year,
        basicSalary: calc.basicSalary,
        earnings: calc.earnings,
        deductions: calc.deductions,
        grossSalary: calc.grossSalary,
        totalDeductions: calc.totalDeductions,
        netSalary: calc.netSalary,
        attendanceSummary: calc.attendanceSummary,
        status: 'Processed',
        processedBy: req.user._id,
        processedDate: new Date(),
      });
      results.processed.push(payroll);

      // eslint-disable-next-line no-await-in-loop
      if (emp.user) {
        // eslint-disable-next-line no-await-in-loop
        await notifyUser(emp.user, {
          title: 'Payroll processed',
          message: `Your payroll for ${month}/${year} has been processed. Net salary: $${calc.netSalary.toFixed(2)}.`,
          type: 'payroll_processed',
          link: '/payroll-history',
        });
      }
    } catch (err) {
      if (err.code === 11000) {
        results.skipped.push({ employee: emp.employeeId, reason: 'Payroll already processed for this period.' });
      } else {
        throw err;
      }
    }
  }

  const admins = await User.find({ role: { $in: [ROLES.ADMIN, ROLES.PAYROLL_MANAGER] } }).select('_id');
  if (results.processed.length > 0) {
    await notifyUsers(admins.map((a) => a._id), {
      title: 'Payroll run complete',
      message: `Processed payroll for ${results.processed.length} employee(s) for ${month}/${year}.`,
      type: 'payroll_processed',
      link: '/payroll-history',
    });
  }

  res.status(201).json({ success: true, data: results });
});

// @desc    List payroll records with filters
// @route   GET /api/payroll
const getPayrolls = asyncHandler(async (req, res) => {
  const { employee, department, month, year, status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (employee) query.employee = employee;
  if (department) query.department = department;
  if (month) query.month = Number(month);
  if (year) query.year = Number(year);
  if (status) query.status = status;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 20));

  const [data, total] = await Promise.all([
    Payroll.find(query)
      .populate('employee', 'firstName lastName employeeId')
      .populate('department', 'name')
      .sort({ year: -1, month: -1, createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Payroll.countDocuments(query),
  ]);

  res.json({ success: true, data, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 } });
});

// @desc    Get single payroll record
// @route   GET /api/payroll/:id
const getPayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id)
    .populate('employee', 'firstName lastName employeeId department')
    .populate('department', 'name')
    .populate('processedBy', 'name');
  if (!payroll) throw new ApiError(404, 'Payroll record not found.');

  if (req.user.role === 'employee' && String(payroll.employee?._id || payroll.employee) !== String(req.user.employee)) {
    throw new ApiError(403, 'You can only access your own payroll records.');
  }

  res.json({ success: true, data: payroll });
});

// @desc    Mark a processed payroll record as Paid
// @route   PUT /api/payroll/:id/mark-paid
const markPaid = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) throw new ApiError(404, 'Payroll record not found.');
  if (payroll.status !== 'Processed') {
    throw new ApiError(400, `Only "Processed" payroll can be marked as Paid (current status: ${payroll.status}).`);
  }
  payroll.status = 'Paid';
  payroll.paymentDate = new Date();
  await payroll.save();
  res.json({ success: true, data: payroll });
});

module.exports = { calculatePayrollPreview, processPayroll, getPayrolls, getPayroll, markPaid };
