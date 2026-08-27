import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import {
  Users, UserCheck, Building2, Wallet, Clock, MinusCircle, PlusCircle, TrendingUp,
} from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import * as dashboardService from '../services/dashboardService';
import { formatCurrency, formatDate, monthLabel } from '../utils/format';
import { getErrorMessage } from '../services/api';

const PIE_COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#312e81', '#3730a3'];
const ATTENDANCE_COLORS = { Present: '#10b981', Absent: '#ef4444', Leave: '#3b82f6', Late: '#f59e0b', 'Half Day': '#a78bfa' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    dashboardService
      .getDashboardData()
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <Spinner fullHeight label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const { cards, charts, recentPayroll } = data;

  const attendanceData = Object.entries(charts.attendanceOverview).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your organization's payroll and workforce.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={cards.totalEmployees} icon={Users} color="brand" />
        <StatCard label="Active Employees" value={cards.activeEmployees} icon={UserCheck} color="green" />
        <StatCard label="Total Departments" value={cards.totalDepartments} icon={Building2} color="blue" />
        <StatCard label="Current Month Payroll" value={formatCurrency(cards.currentMonthPayroll)} icon={Wallet} color="brand" />
        <StatCard label="Pending Payroll" value={cards.pendingPayroll} icon={Clock} color="amber" hint="Employees not yet processed" />
        <StatCard label="Total Deductions" value={formatCurrency(cards.totalDeductions)} icon={MinusCircle} color="red" />
        <StatCard label="Total Bonuses" value={formatCurrency(cards.totalBonuses)} icon={PlusCircle} color="purple" />
        <StatCard label="Average Salary" value={formatCurrency(cards.averageSalary)} icon={TrendingUp} color="green" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Payroll Overview (Last 12 Months)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={charts.payrollOverview} margin={{ left: -10 }}>
              <defs>
                <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="net" name="Net Payroll" stroke="#4f46e5" fill="url(#netGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Department-wise Employees">
          {charts.departmentDistribution.length === 0 ? (
            <EmptyState title="No employees yet" message="Add employees to see this breakdown." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={charts.departmentDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {charts.departmentDistribution.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Salary Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.salaryDistribution} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" name="Employees" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Attendance Overview (This Month)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={attendanceData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="value" name="Days" radius={[6, 6, 0, 0]}>
                {attendanceData.map((entry) => (
                  <Cell key={entry.name} fill={ATTENDANCE_COLORS[entry.name] || '#a1a1aa'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Recent Payroll Activity" noPadding>
        {recentPayroll.length === 0 ? (
          <EmptyState title="No payroll activity yet" message="Process payroll to see recent activity here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Employee</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Period</th>
                  <th className="px-5 py-3 font-medium">Net Salary</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentPayroll.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : '-'}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{p.department?.name || '-'}</td>
                    <td className="px-5 py-3 text-gray-500">{monthLabel(p.month, p.year)}</td>
                    <td className="px-5 py-3 font-medium text-gray-800">{formatCurrency(p.netSalary)}</td>
                    <td className="px-5 py-3">
                      <Badge status={p.status}>{p.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-400">{formatDate(p.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
