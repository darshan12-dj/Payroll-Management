const path = require('path');
const fs = require('fs');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Payslip = require('../models/Payslip');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Settings = require('../models/Settings');
const { generatePayslipPDF } = require('../services/pdfService');
const { generatePayslipNumber } = require('../utils/idGenerator');
const { notifyUser } = require('../utils/notify');

// @desc    List payslips (filterable)
// @route   GET /api/payslips
const getPayslips = asyncHandler(async (req, res) => {
  const { employee, month, year, page = 1, limit = 20 } = req.query;
  const query = {};
  if (employee) query.employee = employee;
  if (month) query.month = Number(month);
  if (year) query.year = Number(year);

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

  const [data, total] = await Promise.all([
    Payslip.find(query)
      .populate({ path: 'employee', select: 'firstName lastName employeeId department', populate: { path: 'department', select: 'name' } })
      .populate('payroll', 'grossSalary totalDeductions netSalary status')
      .sort({ year: -1, month: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Payslip.countDocuments(query),
  ]);

  res.json({ success: true, data, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 } });
});

// @desc    Get single payslip metadata
// @route   GET /api/payslips/:id
const getPayslip = asyncHandler(async (req, res) => {
  const payslip = await Payslip.findById(req.params.id)
    .populate({ path: 'employee', populate: { path: 'department', select: 'name' } })
    .populate('payroll');
  if (!payslip) throw new ApiError(404, 'Payslip not found.');

  if (req.user.role === 'employee' && String(payslip.employee?._id || payslip.employee) !== String(req.user.employee)) {
    throw new ApiError(403, 'You can only access your own payslips.');
  }

  res.json({ success: true, data: payslip });
});

// @desc    Generate a payslip PDF for an already-processed payroll record
// @route   POST /api/payslips/generate/:payrollId
const generatePayslip = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.payrollId).populate({
    path: 'employee',
    populate: { path: 'department', select: 'name' },
  });
  if (!payroll) throw new ApiError(404, 'Payroll record not found.');
  if (payroll.status === 'Draft') {
    throw new ApiError(400, 'Cannot generate a payslip for a Draft payroll record. Process it first.');
  }

  const existing = await Payslip.findOne({ payroll: payroll._id });
  if (existing) {
    return res.json({ success: true, data: existing, message: 'Payslip already exists for this payroll record.' });
  }

  const settings = await Settings.getSingleton();
  const payslipNumber = generatePayslipNumber(payroll.employee.employeeId, payroll.month, payroll.year);

  const filePath = await generatePayslipPDF({
    company: settings,
    employee: payroll.employee,
    payroll,
    payslipNumber,
  });

  const payslip = await Payslip.create({
    payroll: payroll._id,
    employee: payroll.employee._id,
    payslipNumber,
    month: payroll.month,
    year: payroll.year,
    filePath,
  });

  if (payroll.employee.user) {
    await notifyUser(payroll.employee.user, {
      title: 'Payslip generated',
      message: `Your payslip for ${payroll.month}/${payroll.year} is ready to download.`,
      type: 'payslip_generated',
      link: '/payslips',
    });
  }

  res.status(201).json({ success: true, data: payslip });
});

// @desc    Download/stream the payslip PDF
// @route   GET /api/payslips/:id/pdf
const downloadPayslipPDF = asyncHandler(async (req, res) => {
  const payslip = await Payslip.findById(req.params.id);
  if (!payslip) throw new ApiError(404, 'Payslip not found.');

  if (req.user.role === 'employee' && String(payslip.employee) !== String(req.user.employee)) {
    throw new ApiError(403, 'You can only download your own payslips.');
  }

  const absolutePath = path.join(__dirname, '..', payslip.filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new ApiError(404, 'Payslip PDF file is missing on the server. Try regenerating it.');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${payslip.payslipNumber}.pdf"`);
  fs.createReadStream(absolutePath).pipe(res);
});

module.exports = { getPayslips, getPayslip, generatePayslip, downloadPayslipPDF };
