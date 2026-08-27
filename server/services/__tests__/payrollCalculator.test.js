/**
 * Lightweight, dependency-free sanity check for the payroll calculation
 * engine. Run with: node services/__tests__/payrollCalculator.test.js
 * (No test framework required — this environment has no live MongoDB to
 * run full integration tests against, so this exercises the pure
 * calculation logic that everything else builds on.)
 */
const assert = require('assert');
const { calculatePayroll } = require('../payrollCalculator');

function approxEqual(a, b, msg) {
  assert.ok(Math.abs(a - b) < 0.01, `${msg}: expected ~${b}, got ${a}`);
}

// Test 1: Full attendance, no deductions beyond PF.
{
  const result = calculatePayroll({
    salaryStructure: {
      basicSalary: 4000,
      earnings: { hra: 1600, transportAllowance: 200, medicalAllowance: 200, specialAllowance: 300, bonus: 500, overtimeRatePerHour: 20 },
      deductions: { pfPercent: 12, professionalTax: 50, tdsPercent: 5, insurance: 100, loanDeduction: 0, otherDeductions: 0 },
    },
    attendanceSummary: { present: 22, absent: 0, halfDay: 0, leave: 0, late: 0, overtimeHours: 5, totalWorkingDays: 22 },
  });

  approxEqual(result.basicSalary, 4000, 'Full attendance basic salary');
  approxEqual(result.earnings.overtime, 100, 'Overtime pay (5hrs * $20)');
  const expectedGross = 4000 + 1600 + 200 + 200 + 300 + 500 + 100;
  approxEqual(result.grossSalary, expectedGross, 'Gross salary');
  approxEqual(result.deductions.pf, 480, 'PF (12% of basic)');
  approxEqual(result.deductions.tds, expectedGross * 0.05, 'TDS (5% of gross)');
  const expectedDeductions = 480 + 50 + expectedGross * 0.05 + 100;
  approxEqual(result.totalDeductions, expectedDeductions, 'Total deductions');
  approxEqual(result.netSalary, expectedGross - expectedDeductions, 'Net salary');
  console.log('PASS: full attendance calculation');
}

// Test 2: Attendance proration (absences reduce basic + allowances, not bonus).
{
  const result = calculatePayroll({
    salaryStructure: {
      basicSalary: 2200, // 100/day at 22 working days
      earnings: { hra: 0, transportAllowance: 0, medicalAllowance: 0, specialAllowance: 0, bonus: 300, overtimeRatePerHour: 0 },
      deductions: { pfPercent: 0, professionalTax: 0, tdsPercent: 0, insurance: 0, loanDeduction: 0, otherDeductions: 0 },
    },
    attendanceSummary: { present: 20, absent: 2, halfDay: 0, leave: 0, late: 0, overtimeHours: 0, totalWorkingDays: 22 },
  });

  approxEqual(result.basicSalary, 2000, 'Prorated basic for 20/22 days');
  approxEqual(result.earnings.bonus, 300, 'Bonus is not prorated');
  approxEqual(result.grossSalary, 2300, 'Gross = prorated basic + bonus');
  console.log('PASS: attendance proration');
}

// Test 3: Half-day and paid leave counted correctly toward payable days.
{
  const result = calculatePayroll({
    salaryStructure: { basicSalary: 3000, earnings: {}, deductions: {} },
    attendanceSummary: { present: 18, absent: 0, halfDay: 2, leave: 2, late: 0, overtimeHours: 0, totalWorkingDays: 22 },
  });
  // payableDays = 18 + 2*0.5 + 2 = 21
  approxEqual(result.attendanceSummary.payableDays, 21, 'Payable days with half-day + leave');
  approxEqual(result.basicSalary, 3000 * (21 / 22), 'Basic prorated by payable days');
  console.log('PASS: half-day and leave proration');
}

console.log('\nAll payrollCalculator tests passed.');
