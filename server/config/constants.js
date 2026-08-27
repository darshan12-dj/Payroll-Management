// Centralized enums/constants shared across models, controllers, and services.

const ROLES = Object.freeze({
  ADMIN: 'admin',
  PAYROLL_MANAGER: 'payroll_manager',
  EMPLOYEE: 'employee',
});

const ALL_ROLES = Object.values(ROLES);

const EMPLOYMENT_TYPE = Object.freeze(['Full-time', 'Part-time', 'Contract', 'Intern']);

const EMPLOYMENT_STATUS = Object.freeze(['Active', 'Inactive', 'Terminated']);

const GENDER = Object.freeze(['Male', 'Female', 'Other', 'Prefer not to say']);

const ATTENDANCE_STATUS = Object.freeze(['Present', 'Absent', 'Half Day', 'Leave', 'Late']);

const LEAVE_TYPE = Object.freeze(['Casual Leave', 'Sick Leave', 'Earned Leave', 'Unpaid Leave']);

const LEAVE_STATUS = Object.freeze(['Pending', 'Approved', 'Rejected']);

const PAYROLL_STATUS = Object.freeze(['Draft', 'Pending', 'Processed', 'Paid']);

const NOTIFICATION_TYPE = Object.freeze([
  'payroll_processed',
  'payslip_generated',
  'leave_approved',
  'leave_rejected',
  'leave_applied',
  'employee_added',
  'payroll_pending',
  'general',
]);

module.exports = {
  ROLES,
  ALL_ROLES,
  EMPLOYMENT_TYPE,
  EMPLOYMENT_STATUS,
  GENDER,
  ATTENDANCE_STATUS,
  LEAVE_TYPE,
  LEAVE_STATUS,
  PAYROLL_STATUS,
  NOTIFICATION_TYPE,
};
