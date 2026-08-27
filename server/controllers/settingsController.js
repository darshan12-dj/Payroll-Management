const asyncHandler = require('../utils/asyncHandler');
const Settings = require('../models/Settings');

// @desc    Get company/payroll settings
// @route   GET /api/settings
const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  res.json({ success: true, data: settings });
});

// @desc    Update company/payroll settings
// @route   PUT /api/settings
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  const { companyName, logo, address, email, phone, payrollSettings } = req.body;

  if (companyName !== undefined) settings.companyName = companyName;
  if (logo !== undefined) settings.logo = logo;
  if (address !== undefined) settings.address = address;
  if (email !== undefined) settings.email = email;
  if (phone !== undefined) settings.phone = phone;
  if (payrollSettings) {
    settings.payrollSettings = { ...settings.payrollSettings.toObject(), ...payrollSettings };
  }

  await settings.save();
  res.json({ success: true, data: settings });
});

module.exports = { getSettings, updateSettings };
