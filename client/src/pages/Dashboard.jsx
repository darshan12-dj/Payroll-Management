import { useEffect, useState } from 'react';
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

  const { cards, recentPayroll } = data;

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
