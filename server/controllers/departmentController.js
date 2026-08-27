const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Department = require('../models/Department');
const Employee = require('../models/Employee');

// @desc    List departments with employee counts
// @route   GET /api/departments
const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().populate('head', 'firstName lastName employeeId').sort({ name: 1 });

  const counts = await Employee.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  const data = departments.map((d) => ({
    ...d.toObject(),
    employeeCount: countMap.get(String(d._id)) || 0,
  }));

  res.json({ success: true, data });
});

// @desc    Get single department
// @route   GET /api/departments/:id
const getDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id).populate('head', 'firstName lastName employeeId');
  if (!department) throw new ApiError(404, 'Department not found.');
  const employeeCount = await Employee.countDocuments({ department: department._id, isActive: true });
  res.json({ success: true, data: { ...department.toObject(), employeeCount } });
});

// @desc    Create department
// @route   POST /api/departments
const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, head } = req.body;
  const existing = await Department.findOne({ $or: [{ name }, { code: (code || '').toUpperCase() }] });
  if (existing) throw new ApiError(409, 'A department with that name or code already exists.');

  const department = await Department.create({ name, code, description, head: head || null });
  res.status(201).json({ success: true, data: department });
});

// @desc    Update department
// @route   PUT /api/departments/:id
const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw new ApiError(404, 'Department not found.');

  const { name, code, description, head, isActive } = req.body;
  if (name) department.name = name;
  if (code) department.code = code.toUpperCase();
  if (description !== undefined) department.description = description;
  if (head !== undefined) department.head = head || null;
  if (isActive !== undefined) department.isActive = isActive;

  await department.save();
  res.json({ success: true, data: department });
});

// @desc    Delete department (blocked if employees are assigned)
// @route   DELETE /api/departments/:id
const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw new ApiError(404, 'Department not found.');

  const employeeCount = await Employee.countDocuments({ department: department._id });
  if (employeeCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete this department because ${employeeCount} employee(s) are still assigned to it. Reassign them first.`
    );
  }

  await department.deleteOne();
  res.json({ success: true, message: 'Department deleted.' });
});

module.exports = { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment };
