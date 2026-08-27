const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');

/**
 * Generates the next sequential Employee ID, e.g. EMP001, EMP002, ...
 */
async function generateEmployeeId() {
  const last = await Employee.findOne().sort({ createdAt: -1 }).select('employeeId').lean();
  let nextNum = 1;
  if (last && last.employeeId) {
    const match = last.employeeId.match(/(\d+)$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `EMP${String(nextNum).padStart(3, '0')}`;
}

/**
 * Generates a payslip number, e.g. PS-2026-08-EMP001
 */
function generatePayslipNumber(employeeId, month, year) {
  return `PS-${year}-${String(month).padStart(2, '0')}-${employeeId}`;
}

module.exports = { generateEmployeeId, generatePayslipNumber };
