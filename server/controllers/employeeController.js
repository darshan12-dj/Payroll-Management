const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const SalaryStructure = require('../models/SalaryStructure');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const User = require('../models/User');
const { generateEmployeeId } = require('../utils/idGenerator');
const { notifyUsers } = require('../utils/notify');
const { ROLES } = require('../config/constants');

// multipart/form-data (used for the profile-photo upload) only carries flat
// string fields, so the client JSON-stringifies nested objects (address,
// bankDetails, taxInfo). Parse those back out before they hit Mongoose.
const NESTED_FIELDS = ['address', 'bankDetails', 'taxInfo'];
function parseNestedFields(body) {
  const parsed = { ...body };
  NESTED_FIELDS.forEach((field) => {
    if (typeof parsed[field] === 'string') {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch {
        delete parsed[field];
      }
    }
  });
  return parsed;
}

// @desc    List employees with search, filter, sort, pagination
// @route   GET /api/employees
const getEmployees = asyncHandler(async (req, res) => {
  const {
    search = '',
    department,
    status,
    employmentType,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
      { position: { $regex: search, $options: 'i' } },
    ];
  }
  if (department) query.department = department;
  if (status) query.employmentStatus = status;
  if (employmentType) query.employmentType = employmentType;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [employees, total] = await Promise.all([
    Employee.find(query)
      .populate('department', 'name code')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Employee.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: employees,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// @desc    Get single employee (full profile)
// @route   GET /api/employees/:id
const getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id).populate('department', 'name code');
  if (!employee) throw new ApiError(404, 'Employee not found.');
  res.json({ success: true, data: employee });
});

// @desc    Create employee
// @route   POST /api/employees
const createEmployee = asyncHandler(async (req, res) => {
  const body = parseNestedFields(req.body);

  if (!body.department) throw new ApiError(400, 'Department is required.');
  const dept = await Department.findById(body.department);
  if (!dept) throw new ApiError(404, 'Selected department does not exist.');

  const existingEmail = await Employee.findOne({ email: (body.email || '').toLowerCase() });
  if (existingEmail) throw new ApiError(409, 'An employee with that email already exists.');

  const employeeId = body.employeeId || (await generateEmployeeId());
  const existingId = await Employee.findOne({ employeeId });
  if (existingId) throw new ApiError(409, `Employee ID ${employeeId} is already in use.`);

  if (req.file) {
    body.profilePhoto = `/uploads/photos/${req.file.filename}`;
  }

  const employee = await Employee.create({ ...body, employeeId });

  // Seed an initial salary structure from the basic salary provided.
  await SalaryStructure.create({
    employee: employee._id,
    basicSalary: employee.basicSalary,
  });

  // Notify admins/payroll managers.
  const notifyTargets = await User.find({ role: { $in: [ROLES.ADMIN, ROLES.PAYROLL_MANAGER] } }).select('_id');
  await notifyUsers(
    notifyTargets.map((u) => u._id),
    {
      title: 'New employee added',
      message: `${employee.firstName} ${employee.lastName} (${employee.employeeId}) was added to ${dept.name}.`,
      type: 'employee_added',
      link: `/employees/${employee._id}`,
    }
  );

  res.status(201).json({ success: true, data: employee });
});

// @desc    Update employee
// @route   PUT /api/employees/:id
const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw new ApiError(404, 'Employee not found.');

  const body = parseNestedFields(req.body);
  if (body.department) {
    const dept = await Department.findById(body.department);
    if (!dept) throw new ApiError(404, 'Selected department does not exist.');
  }
  if (body.email && body.email.toLowerCase() !== employee.email) {
    const existingEmail = await Employee.findOne({ email: body.email.toLowerCase(), _id: { $ne: employee._id } });
    if (existingEmail) throw new ApiError(409, 'An employee with that email already exists.');
  }
  if (req.file) {
    body.profilePhoto = `/uploads/photos/${req.file.filename}`;
  }

  Object.assign(employee, body);
  await employee.save();

  res.json({ success: true, data: employee });
});

// @desc    Deactivate (soft-delete) or hard-delete an employee
// @route   DELETE /api/employees/:id
const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw new ApiError(404, 'Employee not found.');

  const hard = req.query.hard === 'true';
  if (hard) {
    await employee.deleteOne();
    return res.json({ success: true, message: 'Employee permanently deleted.' });
  }

  employee.employmentStatus = 'Inactive';
  employee.isActive = false;
  await employee.save();
  res.json({ success: true, message: 'Employee deactivated.', data: employee });
});

// @desc    Get an employee's attendance history
// @route   GET /api/employees/:id/attendance
const getEmployeeAttendance = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const query = { employee: req.params.id };
  if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
    query.date = { $gte: start, $lte: end };
  }
  const records = await Attendance.find(query).sort({ date: -1 });
  res.json({ success: true, data: records });
});

// @desc    Get an employee's payroll history
// @route   GET /api/employees/:id/payroll
const getEmployeePayrollHistory = asyncHandler(async (req, res) => {
  const records = await Payroll.find({ employee: req.params.id })
    .sort({ year: -1, month: -1 })
    .populate('department', 'name');
  res.json({ success: true, data: records });
});

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeAttendance,
  getEmployeePayrollHistory,
};
