/**
 * Seed script — populates MongoDB with realistic demo data:
 *   - Settings (company profile)
 *   - 7 departments
 *   - 24 employees spread across departments
 *   - Active salary structures for every employee
 *   - ~2 months of daily attendance history
 *   - A mix of pending/approved/rejected leave requests
 *   - 3 months of processed/paid payroll + generated payslip PDFs
 *   - Notifications
 *   - 3 demo user accounts (admin, payroll manager, employee)
 *
 * Run with: npm run seed   (from /server, or via the root `npm run seed`)
 */
// override:true makes the values in server/.env always win, even if a
// same-named environment variable (e.g. MONGO_URI) already exists at the
// OS level — otherwise dotenv silently keeps the pre-existing value and
// edits to .env appear to have no effect.
require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const SalaryStructure = require('../models/SalaryStructure');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Payslip = require('../models/Payslip');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');

const { calculatePayroll } = require('../services/payrollCalculator');
const { generatePayslipPDF } = require('../services/pdfService');
const { generatePayslipNumber } = require('../utils/idGenerator');
const { DEPARTMENTS, POSITIONS_BY_DEPT, FIRST_NAMES, LAST_NAMES } = require('./data');

const ATTENDANCE_MONTHS_BACK = 2; // months of daily attendance history to generate
const PAYROLL_MONTHS_BACK = 3; // months of processed payroll history to generate

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pad(n, width = 3) {
  return String(n).padStart(width, '0');
}
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

async function run() {
  await connectDB();
  console.log('[Seed] Connected to MongoDB. Clearing existing data...');

  await Promise.all([
    User.deleteMany({}),
    Employee.deleteMany({}),
    Department.deleteMany({}),
    SalaryStructure.deleteMany({}),
    Attendance.deleteMany({}),
    Leave.deleteMany({}),
    Payroll.deleteMany({}),
    Payslip.deleteMany({}),
    Notification.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  // ---------- Settings ----------
  const settings = await Settings.create({
    companyName: process.env.COMPANY_NAME || 'Northbridge Technologies Inc.',
    address: process.env.COMPANY_ADDRESS || '500 Market Street, Suite 900, San Francisco, CA 94105',
    email: process.env.COMPANY_EMAIL || 'hr@northbridge-tech.com',
    phone: process.env.COMPANY_PHONE || '+1 (555) 010-2938',
    payrollSettings: {
      defaultPayDate: 1,
      workingDaysPerMonth: 22,
      overtimeRatePerHour: 25,
      payrollCycle: 'Monthly',
    },
  });
  console.log('[Seed] Settings created.');

  // ---------- Departments ----------
  const departments = await Department.insertMany(DEPARTMENTS);
  const deptByCode = Object.fromEntries(departments.map((d) => [d.code, d]));
  console.log(`[Seed] ${departments.length} departments created.`);

  // ---------- Employees ----------
  const employees = [];
  const deptCodes = Object.keys(POSITIONS_BY_DEPT);
  const usedNames = new Set();
  const departmentByEmployeeId = new Map(); // employee._id -> department doc (for payslip rendering)

  for (let i = 0; i < 24; i += 1) {
    let first;
    let last;
    let key;
    do {
      first = randomItem(FIRST_NAMES);
      last = randomItem(LAST_NAMES);
      key = `${first}${last}`;
    } while (usedNames.has(key));
    usedNames.add(key);

    const deptCode = deptCodes[i % deptCodes.length];
    const department = deptByCode[deptCode];
    const position = randomItem(POSITIONS_BY_DEPT[deptCode]);

    const isManager = position.toLowerCase().includes('manager');
    const basicSalary = isManager ? randomInt(8000, 12000) : randomInt(3500, 7500);

    const joiningYearsAgo = randomInt(0, 6);
    const joiningDate = new Date();
    joiningDate.setFullYear(joiningDate.getFullYear() - joiningYearsAgo);
    joiningDate.setMonth(randomInt(0, 11));
    joiningDate.setDate(randomInt(1, 28));

    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - randomInt(24, 58));
    dob.setMonth(randomInt(0, 11));
    dob.setDate(randomInt(1, 28));

    const employeeId = `EMP${pad(i + 1)}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@northbridge-tech.com`;

    const employee = await Employee.create({
      employeeId,
      firstName: first,
      lastName: last,
      email,
      phone: `+1 (555) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
      dateOfBirth: dob,
      gender: randomItem(['Male', 'Female', 'Other']),
      address: {
        street: `${randomInt(100, 9999)} ${randomItem(['Main St', 'Oak Ave', 'Pine Rd', 'Maple Dr', 'Cedar Ln'])}`,
        city: randomItem(['San Francisco', 'Austin', 'Denver', 'Chicago', 'Seattle', 'Boston']),
        state: randomItem(['CA', 'TX', 'CO', 'IL', 'WA', 'MA']),
        zip: String(randomInt(10000, 99999)),
        country: 'USA',
      },
      department: department._id,
      position,
      joiningDate,
      employmentType: randomItem(['Full-time', 'Full-time', 'Full-time', 'Contract', 'Part-time']),
      employmentStatus: 'Active',
      basicSalary,
      bankDetails: {
        accountNumber: String(randomInt(100000000, 999999999)),
        ifsc: `NBTX0${randomInt(100000, 999999)}`,
        bankName: randomItem(['First National Bank', 'Chase', 'Wells Fargo', 'Bank of America']),
      },
      pan: `${randomItem(['AB', 'CD', 'EF', 'GH'])}${randomInt(1000, 9999)}${randomItem(['X', 'Y', 'Z'])}`,
      pfNumber: `PF${randomInt(100000, 999999)}`,
      taxInfo: { taxId: `TAX-${randomInt(100000, 999999)}`, taxRegime: 'Standard' },
    });

    employees.push(employee);
    departmentByEmployeeId.set(String(employee._id), department);
  }
  console.log(`[Seed] ${employees.length} employees created.`);

  // Assign department heads (first manager-ish employee per department, else first employee in dept).
  for (const dept of departments) {
    const deptEmployees = employees.filter((e) => String(e.department) === String(dept._id));
    if (deptEmployees.length > 0) {
      const head = deptEmployees.find((e) => e.position.toLowerCase().includes('manager')) || deptEmployees[0];
      dept.head = head._id;
      await dept.save();
    }
  }

  // ---------- Salary structures ----------
  const structureByEmployee = new Map();
  for (const emp of employees) {
    const structure = await SalaryStructure.create({
      employee: emp._id,
      basicSalary: emp.basicSalary,
      earnings: {
        hra: Math.round(emp.basicSalary * 0.4),
        transportAllowance: 200,
        medicalAllowance: 150,
        specialAllowance: Math.round(emp.basicSalary * 0.05),
        bonus: randomItem([0, 0, 0, 200, 500]),
        overtimeRatePerHour: 25,
      },
      deductions: {
        pfPercent: 12,
        professionalTax: 25,
        tdsPercent: emp.basicSalary > 8000 ? 10 : emp.basicSalary > 5000 ? 5 : 2,
        insurance: 50,
        loanDeduction: 0,
        otherDeductions: 0,
      },
    });
    structureByEmployee.set(String(emp._id), structure);
  }
  console.log('[Seed] Salary structures created.');

  // ---------- Attendance (last N months, weekdays only) ----------
  const today = new Date();
  const attendanceStart = new Date(today.getFullYear(), today.getMonth() - ATTENDANCE_MONTHS_BACK, 1);
  const attendanceDocs = [];

  for (const emp of employees) {
    const cursor = new Date(attendanceStart);
    while (cursor <= today) {
      if (!isWeekend(cursor)) {
        const roll = Math.random();
        let status = 'Present';
        let overtimeHours = 0;
        if (roll < 0.03) status = 'Absent';
        else if (roll < 0.06) status = 'Half Day';
        else if (roll < 0.11) status = 'Leave';
        else if (roll < 0.18) status = 'Late';
        if (status !== 'Absent' && Math.random() < 0.15) overtimeHours = randomInt(1, 3);

        attendanceDocs.push({
          employee: emp._id,
          date: new Date(cursor),
          status,
          checkIn: status === 'Late' ? '09:45' : '09:02',
          checkOut: '18:05',
          overtimeHours,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  await Attendance.insertMany(attendanceDocs);
  console.log(`[Seed] ${attendanceDocs.length} attendance records created.`);

  // ---------- Leave requests ----------
  const leaveTypes = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Unpaid Leave'];
  const leaveDocs = [];
  for (const emp of employees.slice(0, 14)) {
    const numLeaves = randomInt(1, 2);
    for (let j = 0; j < numLeaves; j += 1) {
      const start = new Date(today);
      start.setDate(start.getDate() - randomInt(-10, 45));
      const days = randomInt(1, 3);
      const end = new Date(start);
      end.setDate(end.getDate() + days - 1);
      const status = randomItem(['Pending', 'Approved', 'Approved', 'Rejected']);
      leaveDocs.push({
        employee: emp._id,
        leaveType: randomItem(leaveTypes),
        startDate: start,
        endDate: end,
        days,
        reason: randomItem([
          'Personal matters', 'Family emergency', 'Not feeling well', 'Scheduled medical appointment', 'Travel plans',
        ]),
        status,
        actionDate: status === 'Pending' ? null : new Date(),
      });
    }
  }
  await Leave.insertMany(leaveDocs);
  console.log(`[Seed] ${leaveDocs.length} leave requests created.`);

  // ---------- Payroll + Payslips (last N months) ----------
  const workingDaysPerMonth = settings.payrollSettings.workingDaysPerMonth;
  let payrollCount = 0;
  let payslipCount = 0;

  for (let m = PAYROLL_MONTHS_BACK - 1; m >= 0; m -= 1) {
    const periodDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const month = periodDate.getMonth() + 1;
    const year = periodDate.getFullYear();
    const isPastMonth = m > 0;

    for (const emp of employees) {
      const structure = structureByEmployee.get(String(emp._id));

      // Build attendance summary directly from the in-memory attendanceDocs
      // for speed (equivalent to attendanceService's DB aggregation).
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
      const records = attendanceDocs.filter(
        (a) => String(a.employee) === String(emp._id) && a.date >= monthStart && a.date <= monthEnd
      );
      const summary = { present: 0, absent: 0, halfDay: 0, leave: 0, late: 0, overtimeHours: 0, totalWorkingDays: workingDaysPerMonth };
      records.forEach((r) => {
        if (r.status === 'Present') summary.present += 1;
        else if (r.status === 'Absent') summary.absent += 1;
        else if (r.status === 'Half Day') summary.halfDay += 1;
        else if (r.status === 'Leave') summary.leave += 1;
        else if (r.status === 'Late') { summary.late += 1; summary.present += 1; }
        summary.overtimeHours += r.overtimeHours || 0;
      });

      const calc = calculatePayroll({ salaryStructure: structure, attendanceSummary: summary });

      const payroll = await Payroll.create({
        employee: emp._id,
        department: emp.department,
        month,
        year,
        basicSalary: calc.basicSalary,
        earnings: calc.earnings,
        deductions: calc.deductions,
        grossSalary: calc.grossSalary,
        totalDeductions: calc.totalDeductions,
        netSalary: calc.netSalary,
        attendanceSummary: calc.attendanceSummary,
        status: isPastMonth ? 'Paid' : 'Processed',
        processedDate: monthEnd,
        paymentDate: isPastMonth ? monthEnd : null,
      });
      payrollCount += 1;

      // Generate a real payslip PDF for each payroll record.
      const payslipNumber = generatePayslipNumber(emp.employeeId, month, year);
      const populatedEmployee = { ...emp.toObject(), department: departmentByEmployeeId.get(String(emp._id)) };
      // eslint-disable-next-line no-await-in-loop
      const filePath = await generatePayslipPDF({
        company: settings,
        employee: populatedEmployee,
        payroll,
        payslipNumber,
      });
      // eslint-disable-next-line no-await-in-loop
      await Payslip.create({
        payroll: payroll._id,
        employee: emp._id,
        payslipNumber,
        month,
        year,
        filePath,
      });
      payslipCount += 1;
    }
  }
  console.log(`[Seed] ${payrollCount} payroll records and ${payslipCount} payslip PDFs generated.`);

  // ---------- Demo user accounts ----------
  const hrEmployee = employees.find((e) => e.position === 'HR Manager') || employees[0];
  const financeEmployee = employees.find((e) => e.position === 'Payroll Manager') || employees[1];
  const staffEmployee = employees[2];

  const adminUser = await User.create({
    name: 'Alexandra Reyes',
    email: 'admin@northbridge-tech.com',
    password: 'Admin@12345',
    role: 'admin',
  });

  const payrollManagerUser = await User.create({
    name: `${financeEmployee.firstName} ${financeEmployee.lastName}`,
    email: 'payroll.manager@northbridge-tech.com',
    password: 'Payroll@12345',
    role: 'payroll_manager',
    employee: financeEmployee._id,
  });
  financeEmployee.user = payrollManagerUser._id;
  await financeEmployee.save();

  const employeeUser = await User.create({
    name: `${staffEmployee.firstName} ${staffEmployee.lastName}`,
    email: 'employee@northbridge-tech.com',
    password: 'Employee@12345',
    role: 'employee',
    employee: staffEmployee._id,
  });
  staffEmployee.user = employeeUser._id;
  await staffEmployee.save();

  console.log('[Seed] Demo user accounts created.');

  // ---------- Notifications ----------
  await Notification.insertMany([
    {
      user: adminUser._id,
      title: 'Welcome to the Payroll Management System',
      message: 'Your admin account is ready. Explore the dashboard to get started.',
      type: 'general',
    },
    {
      user: adminUser._id,
      title: 'Payroll run complete',
      message: `Processed payroll for ${employees.length} employee(s) for the current period.`,
      type: 'payroll_processed',
      link: '/payroll-history',
    },
    {
      user: payrollManagerUser._id,
      title: 'Pending leave requests',
      message: 'There are pending leave requests awaiting your review.',
      type: 'leave_applied',
      link: '/leave',
    },
    {
      user: employeeUser._id,
      title: 'Payslip generated',
      message: 'Your latest payslip is ready to download.',
      type: 'payslip_generated',
      link: '/payslips',
    },
  ]);
  console.log('[Seed] Notifications created.');

  console.log('\n========================================');
  console.log(' Seed complete! Demo login credentials:');
  console.log('========================================');
  console.log(' Admin           : admin@northbridge-tech.com / Admin@12345');
  console.log(' Payroll Manager : payroll.manager@northbridge-tech.com / Payroll@12345');
  console.log(' Employee        : employee@northbridge-tech.com / Employee@12345');
  console.log('========================================\n');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
