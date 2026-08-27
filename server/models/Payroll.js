const mongoose = require('mongoose');
const { PAYROLL_STATUS } = require('../config/constants');

const payrollSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000 },

    basicSalary: { type: Number, required: true },
    earnings: {
      hra: { type: Number, default: 0 },
      transportAllowance: { type: Number, default: 0 },
      medicalAllowance: { type: Number, default: 0 },
      specialAllowance: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      overtime: { type: Number, default: 0 },
    },
    deductions: {
      pf: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 0 },
      tds: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      loanDeduction: { type: Number, default: 0 },
      otherDeductions: { type: Number, default: 0 },
    },
    grossSalary: { type: Number, required: true },
    totalDeductions: { type: Number, required: true },
    netSalary: { type: Number, required: true },

    attendanceSummary: {
      present: { type: Number, default: 0 },
      absent: { type: Number, default: 0 },
      halfDay: { type: Number, default: 0 },
      leave: { type: Number, default: 0 },
      late: { type: Number, default: 0 },
      overtimeHours: { type: Number, default: 0 },
      totalWorkingDays: { type: Number, default: 0 },
      payableDays: { type: Number, default: 0 },
    },

    status: { type: String, enum: PAYROLL_STATUS, default: 'Draft' },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    processedDate: { type: Date, default: null },
    paymentDate: { type: Date, default: null },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

// Prevent duplicate payroll processing for the same employee + month + year.
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
