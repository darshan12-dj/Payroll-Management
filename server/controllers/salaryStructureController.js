const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const SalaryStructure = require('../models/SalaryStructure');
const Employee = require('../models/Employee');
const { calculatePayroll } = require('../services/payrollCalculator');

// @desc    List salary structures (optionally filtered by employee)
// @route   GET /api/salary-structures
const getSalaryStructures = asyncHandler(async (req, res) => {
  const { employee, activeOnly = 'true' } = req.query;
  const query = {};
  if (employee) query.employee = employee;
  if (activeOnly === 'true') query.isActive = true;

  const data = await SalaryStructure.find(query)
    .populate({ path: 'employee', select: 'firstName lastName employeeId department', populate: { path: 'department', select: 'name' } })
    .sort({ createdAt: -1 });
  res.json({ success: true, data });
});

// @desc    Get the active salary structure for one employee
// @route   GET /api/salary-structures/:employeeId
const getSalaryStructureForEmployee = asyncHandler(async (req, res) => {
  const structure = await SalaryStructure.findOne({ employee: req.params.employeeId, isActive: true });
  if (!structure) throw new ApiError(404, 'No active salary structure found for this employee.');
  res.json({ success: true, data: structure });
});

// @desc    Create or update (new version) the salary structure for an employee
// @route   POST /api/salary-structures
const upsertSalaryStructure = asyncHandler(async (req, res) => {
  const { employee, basicSalary, earnings = {}, deductions = {}, effectiveDate } = req.body;
  if (!employee || basicSalary === undefined) {
    throw new ApiError(400, 'employee and basicSalary are required.');
  }
  const empDoc = await Employee.findById(employee);
  if (!empDoc) throw new ApiError(404, 'Employee not found.');
  if (basicSalary < 0) throw new ApiError(400, 'Basic salary cannot be negative.');

  // Deactivate previous structure(s), keep history.
  await SalaryStructure.updateMany({ employee, isActive: true }, { isActive: false });

  const structure = await SalaryStructure.create({
    employee,
    basicSalary,
    earnings,
    deductions,
    effectiveDate: effectiveDate || new Date(),
    isActive: true,
  });

  // Keep the employee's headline basicSalary field in sync for list views.
  empDoc.basicSalary = basicSalary;
  await empDoc.save();

  res.status(201).json({ success: true, data: structure });
});

// @desc    Preview gross/net salary for a hypothetical structure without saving
// @route   POST /api/salary-structures/preview
const previewCalculation = asyncHandler(async (req, res) => {
  const { basicSalary, earnings = {}, deductions = {}, attendanceSummary } = req.body;
  if (basicSalary === undefined) throw new ApiError(400, 'basicSalary is required.');

  const result = calculatePayroll({
    salaryStructure: { basicSalary, earnings, deductions },
    attendanceSummary: attendanceSummary || { present: 22, totalWorkingDays: 22 },
  });

  res.json({ success: true, data: result });
});

module.exports = { getSalaryStructures, getSalaryStructureForEmployee, upsertSalaryStructure, previewCalculation };
