/**
 * Server-side payroll calculation engine.
 *
 * This is the single source of truth for all payroll math. The frontend
 * NEVER computes gross/net salary itself — it only renders numbers this
 * service returns, per the requirement that payroll calculations must be
 * validated and performed on the server.
 *
 * Formulae:
 *   Gross Salary      = Basic + HRA + Transport + Medical + Special + Bonus + Overtime
 *   Total Deductions  = PF + Professional Tax + TDS + Insurance + Loan + Other
 *   Net Salary        = Gross Salary - Total Deductions
 *
 * Attendance proration:
 *   payableDays = present + halfDay*0.5 + paid leave days
 *   (Leave is treated as paid here; Absent and Unpaid Leave are not paid.)
 *   A ratio of payableDays / totalWorkingDays is applied to Basic and the
 *   fixed monthly allowances (HRA/Transport/Medical/Special). Bonus is not
 *   prorated. Overtime is paid strictly for logged overtime hours.
 */

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * @param {Object} params
 * @param {Object} params.salaryStructure - SalaryStructure document (or plain object) with basicSalary, earnings{}, deductions{}
 * @param {Object} params.attendanceSummary - { present, absent, halfDay, leave, late, overtimeHours, totalWorkingDays }
 * @returns {Object} full payroll breakdown
 */
function calculatePayroll({ salaryStructure, attendanceSummary }) {
  if (!salaryStructure) {
    throw new Error('salaryStructure is required to calculate payroll');
  }

  const {
    present = 0,
    absent = 0,
    halfDay = 0,
    leave = 0,
    late = 0,
    overtimeHours = 0,
    totalWorkingDays = 22,
  } = attendanceSummary || {};

  const basicSalary = Number(salaryStructure.basicSalary) || 0;
  const earnings = salaryStructure.earnings || {};
  const deductions = salaryStructure.deductions || {};

  const payableDays = Math.min(
    totalWorkingDays,
    round2(present + halfDay * 0.5 + leave)
  );
  const attendanceRatio = totalWorkingDays > 0 ? payableDays / totalWorkingDays : 0;

  const proratedBasic = round2(basicSalary * attendanceRatio);
  const hra = round2((earnings.hra || 0) * attendanceRatio);
  const transportAllowance = round2((earnings.transportAllowance || 0) * attendanceRatio);
  const medicalAllowance = round2((earnings.medicalAllowance || 0) * attendanceRatio);
  const specialAllowance = round2((earnings.specialAllowance || 0) * attendanceRatio);
  const bonus = round2(earnings.bonus || 0); // not prorated
  const overtime = round2((earnings.overtimeRatePerHour || 0) * overtimeHours);

  const grossSalary = round2(
    proratedBasic + hra + transportAllowance + medicalAllowance + specialAllowance + bonus + overtime
  );

  const pf = round2(proratedBasic * ((deductions.pfPercent || 0) / 100));
  const professionalTax = round2(deductions.professionalTax || 0);
  const tds = round2(grossSalary * ((deductions.tdsPercent || 0) / 100));
  const insurance = round2(deductions.insurance || 0);
  const loanDeduction = round2(deductions.loanDeduction || 0);
  const otherDeductions = round2(deductions.otherDeductions || 0);

  const totalDeductions = round2(pf + professionalTax + tds + insurance + loanDeduction + otherDeductions);
  const netSalary = round2(grossSalary - totalDeductions);

  return {
    basicSalary: proratedBasic,
    earnings: { hra, transportAllowance, medicalAllowance, specialAllowance, bonus, overtime },
    deductions: { pf, professionalTax, tds, insurance, loanDeduction, otherDeductions },
    grossSalary,
    totalDeductions,
    netSalary,
    attendanceSummary: {
      present,
      absent,
      halfDay,
      leave,
      late,
      overtimeHours,
      totalWorkingDays,
      payableDays,
    },
  };
}

module.exports = { calculatePayroll, round2 };
