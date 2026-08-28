/**
 * One-time cleanup script for moving off the demo data and onto your own.
 *
 * What it does:
 *   - Deletes ALL employees, salary structures, attendance, leave, payroll,
 *     and payslip records (plus their generated PDF files) and notifications.
 *   - Deletes ALL existing login accounts (including the demo admin/payroll
 *     manager/employee logins) and creates exactly one fresh Admin account
 *     using the name/email/password you provide on the command line.
 *   - Leaves Departments and Company/Payroll Settings untouched, since
 *     those are reusable structure, not demo "data" — edit or delete them
 *     from the Departments / Settings pages once you're logged in.
 *
 * Usage (run from the server/ folder):
 *   node seed/resetForProduction.js "Your Name" "you@yourcompany.com" "YourStrongPassword123"
 *
 * Your password is only ever read from your own terminal — it is never
 * sent anywhere else. Pick something you wouldn't mind rotating later
 * from Settings > My Account > Change Password.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Employee = require('../models/Employee');
const SalaryStructure = require('../models/SalaryStructure');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Payslip = require('../models/Payslip');
const Notification = require('../models/Notification');

function emptyDir(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  const files = fs.readdirSync(dirPath).filter((f) => f !== '.gitkeep');
  files.forEach((f) => fs.unlinkSync(path.join(dirPath, f)));
  return files.length;
}

async function run() {
  const [, , name, email, password] = process.argv;

  if (!name || !email || !password) {
    console.error('\nUsage: node seed/resetForProduction.js "Your Name" "you@yourcompany.com" "YourStrongPassword123"\n');
    process.exit(1);
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    console.error('That does not look like a valid email address.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters long.');
    process.exit(1);
  }

  await connectDB();
  console.log('[Reset] Connected to MongoDB. Clearing demo employee/payroll data and all logins...');

  await Promise.all([
    Employee.deleteMany({}),
    SalaryStructure.deleteMany({}),
    Attendance.deleteMany({}),
    Leave.deleteMany({}),
    Payroll.deleteMany({}),
    Payslip.deleteMany({}),
    Notification.deleteMany({}),
    User.deleteMany({}),
  ]);

  const removedPhotos = emptyDir(path.join(__dirname, '..', 'uploads', 'photos'));
  const removedPayslips = emptyDir(path.join(__dirname, '..', 'uploads', 'payslips'));

  const admin = await User.create({ name, email, password, role: 'admin' });

  console.log('\n========================================');
  console.log(' Reset complete!');
  console.log('========================================');
  console.log(` Removed:  all employees, salary structures, attendance,`);
  console.log(`           leave requests, payroll records, payslips`);
  console.log(`           (${removedPayslips} PDF file(s)), profile photos`);
  console.log(`           (${removedPhotos} file(s)), notifications, and all logins.`);
  console.log(' Kept:     departments and company/payroll settings.');
  console.log('----------------------------------------');
  console.log(` New admin login: ${admin.email}`);
  console.log(' (password is whatever you passed in — not shown here)');
  console.log('========================================\n');
  console.log('Log in, then use "Add Employee" to start adding your real team.\n');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('[Reset] Failed:', err);
  process.exit(1);
});
