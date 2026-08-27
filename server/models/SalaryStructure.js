const mongoose = require('mongoose');

// One active salary structure per employee. Historical structures are kept
// (isActive:false) so past payroll runs remain traceable to the numbers
// that were in effect at the time.
const salaryStructureSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    basicSalary: { type: Number, required: true, min: 0 },
    earnings: {
      hra: { type: Number, default: 0, min: 0 },
      transportAllowance: { type: Number, default: 0, min: 0 },
      medicalAllowance: { type: Number, default: 0, min: 0 },
      specialAllowance: { type: Number, default: 0, min: 0 },
      bonus: { type: Number, default: 0, min: 0 },
      overtimeRatePerHour: { type: Number, default: 0, min: 0 },
    },
    deductions: {
      pfPercent: { type: Number, default: 12, min: 0, max: 100 }, // % of basic
      professionalTax: { type: Number, default: 0, min: 0 },
      tdsPercent: { type: Number, default: 0, min: 0, max: 100 }, // % of gross
      insurance: { type: Number, default: 0, min: 0 },
      loanDeduction: { type: Number, default: 0, min: 0 },
      otherDeductions: { type: Number, default: 0, min: 0 },
    },
    effectiveDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

salaryStructureSchema.index({ employee: 1, isActive: 1 });

module.exports = mongoose.model('SalaryStructure', salaryStructureSchema);
