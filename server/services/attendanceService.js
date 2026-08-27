const Attendance = require('../models/Attendance');

/**
 * Summarizes an employee's attendance for a given month/year into the
 * shape expected by the payroll calculator.
 */
async function getMonthlyAttendanceSummary(employeeId, month, year, workingDaysPerMonth) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const records = await Attendance.find({
    employee: employeeId,
    date: { $gte: start, $lte: end },
  }).lean();

  const summary = {
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
    late: 0,
    overtimeHours: 0,
    totalWorkingDays: workingDaysPerMonth,
  };

  for (const r of records) {
    switch (r.status) {
      case 'Present':
        summary.present += 1;
        break;
      case 'Absent':
        summary.absent += 1;
        break;
      case 'Half Day':
        summary.halfDay += 1;
        break;
      case 'Leave':
        summary.leave += 1;
        break;
      case 'Late':
        summary.late += 1;
        summary.present += 1; // Late still counts as a worked day
        break;
      default:
        break;
    }
    summary.overtimeHours += r.overtimeHours || 0;
  }

  return summary;
}

module.exports = { getMonthlyAttendanceSummary };
