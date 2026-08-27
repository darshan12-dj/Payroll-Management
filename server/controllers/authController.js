const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { generateAuthToken, generateResetToken } = require('../utils/generateToken');
const { ROLES } = require('../config/constants');

// @desc    Register a new user (admin-created accounts; open registration
//          is intentionally limited to bootstrap/demo use)
// @route   POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, employeeId } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'A user with that email already exists.');
  }

  let employee = null;
  if (employeeId) {
    employee = await Employee.findById(employeeId);
    if (!employee) throw new ApiError(404, 'Linked employee record not found.');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role && Object.values(ROLES).includes(role) ? role : ROLES.EMPLOYEE,
    employee: employee ? employee._id : null,
  });

  if (employee) {
    employee.user = user._id;
    await employee.save();
  }

  const token = generateAuthToken(user);
  res.status(201).json({ success: true, token, user: user.toSafeObject() });
});

// @desc    Login
// @route   POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated. Contact your administrator.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateAuthToken(user);
  res.json({ success: true, token, user: user.toSafeObject() });
});

// @desc    Get the logged-in user's profile
// @route   GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'employee',
    populate: { path: 'department', select: 'name code' },
  });
  res.json({ success: true, user: user.toSafeObject() });
});

// @desc    Request a password reset (returns the reset link/token).
//          In production this would be emailed; here we return it directly
//          in the JSON response so the flow is fully testable without an
//          external email service, and log it to the server console.
// @route   POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });

  // Always respond with success to avoid leaking which emails are registered.
  if (!user) {
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  }

  const resetToken = generateResetToken(user);
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordTokenHash = resetTokenHash;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  // Third-party integration point: plug in an email provider (SendGrid, SES,
  // Postmark, etc.) here to deliver `resetUrl` to the user's inbox. Until
  // then, we surface it directly for local/demo use.
  console.log(`[Password Reset] Reset link for ${user.email}: ${resetUrl}`);

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
    // Included for local development/demo only — a real deployment would
    // remove this field and rely purely on the emailed link.
    devResetUrl: resetUrl,
  });
});

// @desc    Reset password using the token from the forgot-password step
// @route   POST /api/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
  } catch (err) {
    throw new ApiError(400, 'This password reset link is invalid or has expired.');
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    _id: decoded.id,
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordTokenHash +resetPasswordExpires');

  if (!user) {
    throw new ApiError(400, 'This password reset link is invalid or has expired.');
  }

  user.password = password;
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
});

// @desc    Change password while logged in
// @route   POST /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters long.');
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword || '');
  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect.');
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully.' });
});

module.exports = { register, login, getMe, forgotPassword, resetPassword, changePassword };
