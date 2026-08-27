const mongoose = require('mongoose');
const { EMPLOYMENT_TYPE, EMPLOYMENT_STATUS, GENDER } = require('../config/constants');

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: { type: String, required: [true, 'Phone number is required'], trim: true },
    dateOfBirth: { type: Date, required: [true, 'Date of birth is required'] },
    gender: { type: String, enum: GENDER, required: [true, 'Gender is required'] },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
      country: { type: String, default: 'USA' },
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: [true, 'Department is required'] },
    position: { type: String, required: [true, 'Position is required'], trim: true },
    joiningDate: { type: Date, required: [true, 'Joining date is required'] },
    employmentType: { type: String, enum: EMPLOYMENT_TYPE, default: 'Full-time' },
    employmentStatus: { type: String, enum: EMPLOYMENT_STATUS, default: 'Active' },
    basicSalary: { type: Number, required: [true, 'Basic salary is required'], min: [0, 'Basic salary cannot be negative'] },
    bankDetails: {
      accountNumber: { type: String, default: '' },
      ifsc: { type: String, default: '' },
      bankName: { type: String, default: '' },
    },
    pan: { type: String, default: '', trim: true, uppercase: true },
    pfNumber: { type: String, default: '', trim: true },
    taxInfo: {
      taxId: { type: String, default: '' },
      taxRegime: { type: String, default: 'Standard' },
    },
    profilePhoto: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

employeeSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

employeeSchema.index({ firstName: 'text', lastName: 'text', email: 'text', employeeId: 'text' });

module.exports = mongoose.model('Employee', employeeSchema);
