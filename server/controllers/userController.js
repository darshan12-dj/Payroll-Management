const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

// @desc    List all users (admin only)
// @route   GET /api/users
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().populate('employee', 'employeeId firstName lastName').sort({ createdAt: -1 });
  res.json({ success: true, data: users.map((u) => u.toSafeObject()) });
});

// @desc    Update a user's role or active status (admin only)
// @route   PUT /api/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');

  const { role, isActive, name } = req.body;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (name) user.name = name;

  await user.save();
  res.json({ success: true, data: user.toSafeObject() });
});

// @desc    Update the logged-in user's own profile (name, photo)
// @route   PUT /api/users/me
const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, profilePhoto } = req.body;
  if (name) user.name = name;
  if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
  if (req.file) user.profilePhoto = `/uploads/photos/${req.file.filename}`;
  await user.save();
  res.json({ success: true, data: user.toSafeObject() });
});

// @desc    Delete a user account (admin only)
// @route   DELETE /api/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (String(user._id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot delete your own account.');
  }
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted.' });
});

module.exports = { getUsers, updateUser, updateMyProfile, deleteUser };
