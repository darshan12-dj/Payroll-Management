const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema(
  {
    payroll: { type: mongoose.Schema.Types.ObjectId, ref: 'Payroll', required: true, unique: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    payslipNumber: { type: String, required: true, unique: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    generatedDate: { type: Date, default: Date.now },
    filePath: { type: String, required: true }, // relative path under /uploads/payslips
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payslip', payslipSchema);
