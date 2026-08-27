import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Calendar, Briefcase, Building2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import * as employeeService from '../../services/employeeService';
import * as salaryStructureService from '../../services/salaryStructureService';
import * as attendanceService from '../../services/attendanceService';
import { formatCurrency, formatDate, monthLabel } from '../../utils/format';
import { getErrorMessage } from '../../services/api';

const TABS = ['Personal Information', 'Employment Information', 'Salary Information', 'Attendance Summary', 'Payroll History'];

export default function EmployeeProfile({ employeeIdOverride }) {
  const { id: routeId } = useParams();
  const id = employeeIdOverride || routeId;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [salaryStructure, setSalaryStructure] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(TABS[0]);

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      employeeService.getEmployee(id),
      salaryStructureService.getSalaryStructureForEmployee(id).catch(() => ({ data: { data: null } })),
      attendanceService.getAttendanceStats({ employee: id }).catch(() => ({ data: { data: null } })),
      employeeService.getEmployeePayrollHistory(id).catch(() => ({ data: { data: [] } })),
    ])
      .then(([empRes, salRes, attRes, payRes]) => {
        setEmployee(empRes.data.data);
        setSalaryStructure(salRes.data.data);
        setAttendanceStats(attRes.data.data);
        setPayrollHistory(payRes.data.data);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (loading) return <Spinner fullHeight label="Loading employee profile..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!employee) return <EmptyState title="Employee not found" />;

  const grossSalary =
    employee.basicSalary +
    (salaryStructure?.earnings?.hra || 0) +
    (salaryStructure?.earnings?.transportAllowance || 0) +
    (salaryStructure?.earnings?.medicalAllowance || 0) +
    (salaryStructure?.earnings?.specialAllowance || 0);
  const totalDeductions =
    (salaryStructure ? (employee.basicSalary * (salaryStructure.deductions?.pfPercent || 0)) / 100 : 0) +
    (salaryStructure?.deductions?.professionalTax || 0) +
    (salaryStructure?.deductions?.insurance || 0) +
    (salaryStructure?.deductions?.loanDeduction || 0) +
    (salaryStructure?.deductions?.otherDeductions || 0);

  return (
    <div className="space-y-6">
      {!employeeIdOverride && (
        <Link to="/employees" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back to employees
        </Link>
      )}

      <Card>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Avatar src={employee.profilePhoto} firstName={employee.firstName} lastName={employee.lastName} size={64} />
            <div>
              <h1 className="text-lg font-bold text-gray-900">{employee.firstName} {employee.lastName}</h1>
              <p className="text-sm text-gray-500">{employee.position} &middot; {employee.department?.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge status={employee.employmentStatus}>{employee.employmentStatus}</Badge>
                <span className="font-mono text-xs text-gray-400">{employee.employeeId}</span>
              </div>
            </div>
          </div>
          {user.role === 'admin' && (
            <Button icon={Pencil} variant="secondary" onClick={() => navigate(`/employees/${id}/edit`)}>
              Edit
            </Button>
          )}
        </div>
      </Card>

      <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Personal Information' && (
        <Card>
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <InfoRow icon={Mail} label="Email" value={employee.email} />
            <InfoRow icon={Phone} label="Phone" value={employee.phone} />
            <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(employee.dateOfBirth)} />
            <InfoRow icon={MapPin} label="Address" value={formatAddress(employee.address)} />
            <InfoRow label="Gender" value={employee.gender} />
          </dl>
        </Card>
      )}

      {tab === 'Employment Information' && (
        <Card>
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <InfoRow label="Employee ID" value={employee.employeeId} />
            <InfoRow icon={Building2} label="Department" value={employee.department?.name} />
            <InfoRow icon={Briefcase} label="Position" value={employee.position} />
            <InfoRow icon={Calendar} label="Joining Date" value={formatDate(employee.joiningDate)} />
            <InfoRow label="Employment Type" value={employee.employmentType} />
            <InfoRow label="Status" value={<Badge status={employee.employmentStatus}>{employee.employmentStatus}</Badge>} />
          </dl>
        </Card>
      )}

      {tab === 'Salary Information' && (
        <Card>
          {!salaryStructure ? (
            <EmptyState title="No salary structure configured" message="Configure this employee's salary structure to see a breakdown." />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Earnings</h4>
                <dl className="space-y-2 text-sm">
                  <Row label="Basic Salary" value={employee.basicSalary} />
                  <Row label="HRA" value={salaryStructure.earnings.hra} />
                  <Row label="Transport Allowance" value={salaryStructure.earnings.transportAllowance} />
                  <Row label="Medical Allowance" value={salaryStructure.earnings.medicalAllowance} />
                  <Row label="Special Allowance" value={salaryStructure.earnings.specialAllowance} />
                  <Row label="Bonus" value={salaryStructure.earnings.bonus} />
                </dl>
              </div>
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Deductions</h4>
                <dl className="space-y-2 text-sm">
                  <Row label={`PF (${salaryStructure.deductions.pfPercent}%)`} value={(employee.basicSalary * salaryStructure.deductions.pfPercent) / 100} />
                  <Row label="Professional Tax" value={salaryStructure.deductions.professionalTax} />
                  <Row label="Insurance" value={salaryStructure.deductions.insurance} />
                  <Row label="Loan Deduction" value={salaryStructure.deductions.loanDeduction} />
                  <Row label="Other Deductions" value={salaryStructure.deductions.otherDeductions} />
                </dl>
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-4 rounded-lg bg-gray-50 p-4">
                <Metric label="Gross Salary" value={grossSalary} />
                <Metric label="Total Deductions" value={totalDeductions} negative />
                <Metric label="Net Salary" value={grossSalary - totalDeductions} highlight />
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === 'Attendance Summary' && (
        <Card>
          {!attendanceStats ? (
            <EmptyState title="No attendance data" />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <Metric label="Present" value={attendanceStats.present} plain />
              <Metric label="Absent" value={attendanceStats.absent} plain />
              <Metric label="Leave" value={attendanceStats.leave} plain />
              <Metric label="Late" value={attendanceStats.late} plain />
              <Metric label="Overtime (hrs)" value={attendanceStats.overtimeHours} plain />
            </div>
          )}
        </Card>
      )}

      {tab === 'Payroll History' && (
        <Card noPadding>
          {payrollHistory.length === 0 ? (
            <EmptyState title="No payroll history" message="Payroll records will appear here once processed." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="px-5 py-3">Period</th>
                    <th className="px-5 py-3">Gross</th>
                    <th className="px-5 py-3">Deductions</th>
                    <th className="px-5 py-3">Net Salary</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payrollHistory.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">{monthLabel(p.month, p.year)}</td>
                      <td className="px-5 py-3">{formatCurrency(p.grossSalary)}</td>
                      <td className="px-5 py-3">{formatCurrency(p.totalDeductions)}</td>
                      <td className="px-5 py-3 font-medium text-gray-800">{formatCurrency(p.netSalary)}</td>
                      <td className="px-5 py-3"><Badge status={p.status}>{p.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function formatAddress(addr) {
  if (!addr) return '-';
  return [addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(', ');
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
        {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-800">{value || '-'}</dd>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-gray-50 py-1.5">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800">{formatCurrency(value)}</dd>
    </div>
  );
}

function Metric({ label, value, negative, highlight, plain }) {
  return (
    <div className={`rounded-lg px-4 py-2 ${highlight ? 'bg-brand-600 text-white' : plain ? '' : 'bg-white'}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${highlight ? 'text-brand-100' : 'text-gray-400'}`}>{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-white' : negative ? 'text-red-600' : 'text-gray-900'}`}>
        {plain ? value : formatCurrency(value)}
      </p>
    </div>
  );
}
