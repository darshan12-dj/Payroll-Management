const asyncHandler = require('../utils/asyncHandler');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// @desc    Aggregated stats + chart data for the main dashboard
// @route   GET /api/dashboard
const getDashboardData = asyncHandler(async (req, res) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [totalEmployees, activeEmployees, totalDepartments, departments] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ employmentStatus: 'Active' }),
    Department.countDocuments(),
    Department.find().select('name'),
  ]);

  // Current month payroll aggregate
  const currentMonthAgg = await Payroll.aggregate([
    { $match: { month: currentMonth, year: currentYear } },
    {
      $group: {
        _id: null,
        totalGross: { $sum: '$grossSalary' },
        totalDeductions: { $sum: '$totalDeductions' },
        totalNet: { $sum: '$netSalary' },
        totalBonus: { $sum: '$earnings.bonus' },
        count: { $sum: 1 },
        pending: { $sum: { $cond: [{ $in: ['$status', ['Draft', 'Pending']] }, 1, 0] } },
      },
    },
  ]);
  const currentMonthStats = currentMonthAgg[0] || {
    totalGross: 0, totalDeductions: 0, totalNet: 0, totalBonus: 0, count: 0, pending: 0,
  };

  const pendingEmployeesWithoutPayroll = Math.max(0, activeEmployees - currentMonthStats.count);

  // Average salary across active employees (basic salary)
  const avgSalaryAgg = await Employee.aggregate([
    { $match: { employmentStatus: 'Active' } },
    { $group: { _id: null, avg: { $avg: '$basicSalary' } } },
  ]);
  const averageSalary = avgSalaryAgg[0]?.avg || 0;

  // Payroll overview: last 12 months
  const months = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    months.push({ month: d.getMonth() + 1, year: d.getFullYear(), label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` });
  }
  const payrollAgg = await Payroll.aggregate([
    {
      $match: {
        $or: months.map((m) => ({ month: m.month, year: m.year })),
      },
    },
    { $group: { _id: { month: '$month', year: '$year' }, total: { $sum: '$netSalary' }, gross: { $sum: '$grossSalary' } } },
  ]);
  const payrollMap = new Map(payrollAgg.map((p) => [`${p._id.month}-${p._id.year}`, p]));
  const payrollOverview = months.map((m) => ({
    label: m.label,
    net: payrollMap.get(`${m.month}-${m.year}`)?.total || 0,
    gross: payrollMap.get(`${m.month}-${m.year}`)?.gross || 0,
  }));

  // Department-wise employee distribution
  const deptAgg = await Employee.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ]);
  const deptMap = new Map(departments.map((d) => [String(d._id), d.name]));
  const departmentDistribution = deptAgg.map((d) => ({
    name: deptMap.get(String(d._id)) || 'Unassigned',
    value: d.count,
  }));

  // Salary distribution buckets
  const salaryBuckets = [
    { label: '< $3k', min: 0, max: 3000 },
    { label: '$3k-5k', min: 3000, max: 5000 },
    { label: '$5k-8k', min: 5000, max: 8000 },
    { label: '$8k-12k', min: 8000, max: 12000 },
    { label: '$12k+', min: 12000, max: Infinity },
  ];
  const allSalaries = await Employee.find({ employmentStatus: 'Active' }).select('basicSalary').lean();
  const salaryDistribution = salaryBuckets.map((b) => ({
    label: b.label,
    count: allSalaries.filter((e) => e.basicSalary >= b.min && e.basicSalary < b.max).length,
  }));

  // Attendance overview for current month
  const start = new Date(currentYear, currentMonth - 1, 1);
  const end = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
  const attendanceAgg = await Attendance.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const attendanceOverview = { Present: 0, Absent: 0, Leave: 0, Late: 0, 'Half Day': 0 };
  attendanceAgg.forEach((a) => {
    if (attendanceOverview[a._id] !== undefined) attendanceOverview[a._id] = a.count;
  });

  // Recent payroll activity
  const recentPayroll = await Payroll.find()
    .populate('employee', 'firstName lastName employeeId')
    .populate('department', 'name')
    .sort({ updatedAt: -1 })
    .limit(8);

  res.json({
    success: true,
    data: {
      cards: {
        totalEmployees,
        activeEmployees,
        totalDepartments,
        currentMonthPayroll: currentMonthStats.totalNet,
        pendingPayroll: pendingEmployeesWithoutPayroll,
        totalDeductions: currentMonthStats.totalDeductions,
        totalBonuses: currentMonthStats.totalBonus,
        averageSalary,
      },
      charts: {
        payrollOverview,
        departmentDistribution,
        salaryDistribution,
        attendanceOverview,
      },
      recentPayroll,
    },
  });
});

module.exports = { getDashboardData };
