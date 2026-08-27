import { useEffect, useState } from 'react';
import { Plus, CalendarCheck, UserCheck, UserX, Clock, Timer } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import StatCard from '../components/dashboard/StatCard';
import { Select } from '../components/ui/FormField';
import AttendanceCalendar from '../components/attendance/AttendanceCalendar';
import MarkAttendanceModal from '../components/attendance/MarkAttendanceModal';
import { useAuth } from '../context/AuthContext';
import * as attendanceService from '../services/attendanceService';
import * as employeeService from '../services/employeeService';
import { formatDate, MONTH_NAMES } from '../utils/format';
import { getErrorMessage } from '../services/api';

const CAN_MANAGE = ['admin', 'payroll_manager'];

export default function Attendance() {
  const { user } = useAuth();
  const canManage = CAN_MANAGE.includes(user.role);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markOpen, setMarkOpen] = useState(false);

  useEffect(() => {
    if (canManage) {
      employeeService.getEmployees({ limit: 100 }).then((res) => setEmployees(res.data.data)).catch(() => {});
    }
  }, [canManage]);

  const load = () => {
    setLoading(true);
    setError('');
    const params = { month, year };
    if (canManage && selectedEmployee) params.employee = selectedEmployee;

    Promise.all([
      attendanceService.getAttendance(params),
      attendanceService.getAttendanceStats(canManage ? { month, year, employee: selectedEmployee || undefined } : { month, year }),
    ])
      .then(([recRes, statsRes]) => {
        setRecords(recRes.data.data);
        setStats(statsRes.data.data);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [month, year, selectedEmployee]);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const showCalendar = !canManage || selectedEmployee;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500">{canManage ? "Track and manage your team's attendance." : 'View your attendance history.'}</p>
        </div>
        {canManage && (
          <Button icon={Plus} onClick={() => setMarkOpen(true)}>
            Mark Attendance
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-40">
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </Select>
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28">
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
        {canManage && (
          <Select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="w-64">
            <option value="">All Employees (table view)</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
            ))}
          </Select>
        )}
      </div>

      {loading ? (
        <Spinner label="Loading attendance..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Present" value={`${stats.present} days`} icon={UserCheck} color="green" />
              <StatCard label="Absent" value={`${stats.absent} days`} icon={UserX} color="red" />
              <StatCard label="Leave" value={`${stats.leave} days`} icon={CalendarCheck} color="blue" />
              <StatCard label="Late" value={`${stats.late} days`} icon={Clock} color="amber" />
              <StatCard label="Overtime" value={`${stats.overtimeHours} hrs`} icon={Timer} color="purple" />
            </div>
          )}

          {showCalendar ? (
            <Card title={`Attendance Calendar — ${MONTH_NAMES[month - 1]} ${year}`}>
              {records.length === 0 ? (
                <EmptyState title="No attendance records" message="No attendance has been recorded for this period." />
              ) : (
                <AttendanceCalendar month={month} year={year} records={records} />
              )}
            </Card>
          ) : (
            <Card noPadding title="All Employees — Attendance Records">
              {records.length === 0 ? (
                <EmptyState title="No attendance records" message="No attendance has been recorded for this period." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                      <tr>
                        <th className="px-5 py-3">Employee</th>
                        <th className="px-5 py-3">Department</th>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Overtime</th>
                        <th className="px-5 py-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {records.map((r) => (
                        <tr key={r._id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium text-gray-800">
                            {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '-'}
                          </td>
                          <td className="px-5 py-3 text-gray-500">{r.employee?.department?.name || '-'}</td>
                          <td className="px-5 py-3 text-gray-500">{formatDate(r.date)}</td>
                          <td className="px-5 py-3"><Badge status={r.status}>{r.status}</Badge></td>
                          <td className="px-5 py-3 text-gray-500">{r.overtimeHours ? `${r.overtimeHours}h` : '-'}</td>
                          <td className="px-5 py-3 text-gray-400">{r.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </>
      )}

      <MarkAttendanceModal open={markOpen} onClose={() => setMarkOpen(false)} employees={employees} onSaved={load} />
    </div>
  );
}
