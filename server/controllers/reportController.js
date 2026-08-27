const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { toCSV, toExcelBuffer, toPDFBuffer } = require('../services/exportService');

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ---------- Report data builders ----------

async function buildPayrollReport({ month, year, department }) {
  const query = {};
  if (month) query.month = Number(month);
  if (year) query.year = Number(year);
  if (department) query.department = department;

  const records = await Payroll.find(query)
    .populate('employee', 'firstName lastName employeeId')
    .populate('department', 'name')
    .sort({ year: -1, month: -1 });

  const rows = records.map((p) => ({
    employeeId: p.employee?.employeeId || '-',
    employeeName: p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : '-',
    department: p.department?.name || '-',
    period: `${MONTH_NAMES[p.month - 1]} ${p.year}`,
    basicSalary: p.basicSalary.toFixed(2),
    grossSalary: p.grossSalary.toFixed(2),
    totalDeductions: p.totalDeductions.toFixed(2),
    netSalary: p.netSalary.toFixed(2),
    status: p.status,
  }));

  const summary = {
    totalRecords: rows.length,
    totalGross: records.reduce((s, p) => s + p.grossSalary, 0),
    totalDeductions: records.reduce((s, p) => s + p.totalDeductions, 0),
    totalNet: records.reduce((s, p) => s + p.netSalary, 0),
  };

  const columns = [
    { key: 'employeeId', label: 'Employee ID', width: 14 },
    { key: 'employeeName', label: 'Employee Name', width: 24 },
    { key: 'department', label: 'Department', width: 18 },
    { key: 'period', label: 'Pay Period', width: 16 },
    { key: 'basicSalary', label: 'Basic Salary', width: 14 },
    { key: 'grossSalary', label: 'Gross Salary', width: 14 },
    { key: 'totalDeductions', label: 'Deductions', width: 14 },
    { key: 'netSalary', label: 'Net Salary', width: 14 },
    { key: 'status', label: 'Status', width: 12 },
  ];

  return { rows, columns, summary, title: 'Payroll Report' };
}

async function buildAttendanceReport({ month, year, employee }) {
  const now = new Date();
  const m = Number(month) || now.getMonth() + 1;
  const y = Number(year) || now.getFullYear();
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);

  const query = { date: { $gte: start, $lte: end } };
  if (employee) query.employee = employee;

  const records = await Attendance.find(query)
    .populate({ path: 'employee', select: 'firstName lastName employeeId department', populate: { path: 'department', select: 'name' } })
    .sort({ date: 1 });

  const byEmployee = new Map();
  records.forEach((r) => {
    const key = String(r.employee?._id);
    if (!byEmployee.has(key)) {
      byEmployee.set(key, {
        employeeId: r.employee?.employeeId || '-',
        employeeName: r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '-',
        department: r.employee?.department?.name || '-',
        present: 0, absent: 0, halfDay: 0, leave: 0, late: 0, overtimeHours: 0,
      });
    }
    const entry = byEmployee.get(key);
    const map = { Present: 'present', Absent: 'absent', 'Half Day': 'halfDay', Leave: 'leave', Late: 'late' };
    if (map[r.status]) entry[map[r.status]] += 1;
    entry.overtimeHours += r.overtimeHours || 0;
  });

  const rows = Array.from(byEmployee.values());
  const columns = [
    { key: 'employeeId', label: 'Employee ID', width: 14 },
    { key: 'employeeName', label: 'Employee Name', width: 24 },
    { key: 'department', label: 'Department', width: 18 },
    { key: 'present', label: 'Present', width: 10 },
    { key: 'absent', label: 'Absent', width: 10 },
    { key: 'halfDay', label: 'Half Day', width: 10 },
    { key: 'leave', label: 'Leave', width: 10 },
    { key: 'late', label: 'Late', width: 10 },
    { key: 'overtimeHours', label: 'Overtime (hrs)', width: 14 },
  ];

  return { rows, columns, summary: { totalRecords: rows.length }, title: `Attendance Report - ${MONTH_NAMES[m - 1]} ${y}` };
}

async function buildSalaryReport() {
  const employees = await Employee.find({ employmentStatus: 'Active' })
    .populate('department', 'name')
    .select('employeeId firstName lastName department basicSalary position');

  const rows = employees.map((e) => ({
    employeeId: e.employeeId,
    employeeName: `${e.firstName} ${e.lastName}`,
    department: e.department?.name || '-',
    position: e.position,
    basicSalary: e.basicSalary.toFixed(2),
  }));

  const salaries = employees.map((e) => e.basicSalary);
  const summary = {
    totalRecords: rows.length,
    averageSalary: salaries.length ? salaries.reduce((a, b) => a + b, 0) / salaries.length : 0,
    highestSalary: salaries.length ? Math.max(...salaries) : 0,
    lowestSalary: salaries.length ? Math.min(...salaries) : 0,
  };

  const columns = [
    { key: 'employeeId', label: 'Employee ID', width: 14 },
    { key: 'employeeName', label: 'Employee Name', width: 24 },
    { key: 'department', label: 'Department', width: 18 },
    { key: 'position', label: 'Position', width: 20 },
    { key: 'basicSalary', label: 'Basic Salary', width: 14 },
  ];

  return { rows, columns, summary, title: 'Salary Report' };
}

async function buildDeductionReport({ month, year, department }) {
  const query = {};
  if (month) query.month = Number(month);
  if (year) query.year = Number(year);
  if (department) query.department = department;

  const records = await Payroll.find(query)
    .populate('employee', 'firstName lastName employeeId')
    .populate('department', 'name');

  const rows = records.map((p) => ({
    employeeId: p.employee?.employeeId || '-',
    employeeName: p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : '-',
    department: p.department?.name || '-',
    pf: p.deductions.pf.toFixed(2),
    professionalTax: p.deductions.professionalTax.toFixed(2),
    tds: p.deductions.tds.toFixed(2),
    insurance: p.deductions.insurance.toFixed(2),
    loanDeduction: p.deductions.loanDeduction.toFixed(2),
    otherDeductions: p.deductions.otherDeductions.toFixed(2),
    totalDeductions: p.totalDeductions.toFixed(2),
  }));

  const summary = {
    totalRecords: rows.length,
    totalPF: records.reduce((s, p) => s + p.deductions.pf, 0),
    totalTDS: records.reduce((s, p) => s + p.deductions.tds, 0),
    totalOther: records.reduce((s, p) => s + p.deductions.otherDeductions, 0),
    totalDeductions: records.reduce((s, p) => s + p.totalDeductions, 0),
  };

  const columns = [
    { key: 'employeeId', label: 'Employee ID', width: 14 },
    { key: 'employeeName', label: 'Employee Name', width: 24 },
    { key: 'department', label: 'Department', width: 18 },
    { key: 'pf', label: 'PF', width: 12 },
    { key: 'professionalTax', label: 'Prof. Tax', width: 12 },
    { key: 'tds', label: 'TDS', width: 12 },
    { key: 'insurance', label: 'Insurance', width: 12 },
    { key: 'loanDeduction', label: 'Loan Ded.', width: 12 },
    { key: 'otherDeductions', label: 'Other', width: 12 },
    { key: 'totalDeductions', label: 'Total Deductions', width: 16 },
  ];

  return { rows, columns, summary, title: 'Deduction Report' };
}

const REPORT_BUILDERS = {
  payroll: buildPayrollReport,
  attendance: buildAttendanceReport,
  salary: buildSalaryReport,
  deduction: buildDeductionReport,
};

// @desc    Generate a report as JSON (used to render on-screen before export)
// @route   GET /api/reports/:type
const getReport = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const builder = REPORT_BUILDERS[type];
  if (!builder) throw new ApiError(400, `Unknown report type "${type}". Valid types: ${Object.keys(REPORT_BUILDERS).join(', ')}.`);

  const report = await builder(req.query);
  res.json({ success: true, data: report });
});

// @desc    Export a report as CSV, Excel, or PDF
// @route   GET /api/reports/:type/export?format=csv|excel|pdf
const exportReport = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { format = 'csv' } = req.query;
  const builder = REPORT_BUILDERS[type];
  if (!builder) throw new ApiError(400, `Unknown report type "${type}".`);

  const report = await builder(req.query);
  const filenameBase = `${type}-report-${Date.now()}`;

  if (format === 'csv') {
    const csv = toCSV(report.rows, report.columns);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
    return res.send(csv);
  }

  if (format === 'excel') {
    const buffer = await toExcelBuffer(report.rows, report.columns, report.title);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.xlsx"`);
    return res.send(Buffer.from(buffer));
  }

  if (format === 'pdf') {
    const buffer = await toPDFBuffer(report.title, report.rows, report.columns);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`);
    return res.send(buffer);
  }

  throw new ApiError(400, 'format must be one of: csv, excel, pdf.');
});

module.exports = { getReport, exportReport };
