const mongoose = require('mongoose');
const { LEAVE_TYPE, LEAVE_STATUS } = require('../config/constants');

const leaveSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    leaveType: { type: String, enum: LEAVE_TYPE, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 0.5 },
    reason: { type: String, required: [true, 'Reason is required'], trim: true },
    status: { type: String, enum: LEAVE_STATUS, default: 'Pending' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actionDate: { type: Date, default: null },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

leaveSchema.index({ employee: 1, startDate: -1 });

module.exports = mongoose.model('Leave', leaveSchema);
