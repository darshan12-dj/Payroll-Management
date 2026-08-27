const mongoose = require('mongoose');

// Singleton document (there is exactly one Settings record for the company).
const settingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: 'Your Company Inc.' },
    logo: { type: String, default: '' },
    address: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    payrollSettings: {
      defaultPayDate: { type: Number, default: 1, min: 1, max: 28 }, // day of month
      workingDaysPerMonth: { type: Number, default: 22, min: 1, max: 31 },
      overtimeRatePerHour: { type: Number, default: 25, min: 0 },
      payrollCycle: { type: String, default: 'Monthly' },
    },
  },
  { timestamps: true }
);

settingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

module.exports = mongoose.model('Settings', settingsSchema);
