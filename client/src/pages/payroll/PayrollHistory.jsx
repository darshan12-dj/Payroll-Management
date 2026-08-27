import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, CheckCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Pagination from '../../components/ui/Pagination';
import { Select } from '../../components/ui/FormField';
import { useAuth } from '../../context/AuthContext';
import * as payrollService from '../../services/payrollService';
import * as employeeService from '../../services/employeeService';
import * as departmentService from '../../services/departmentService';
import * as payslipService from '../../services/payslipService';
import { formatCurrency, formatDate, monthLabel, MONTH_NAMES } from '../../utils/format';
import { getErrorMessage } from '../../services/api';

const CAN_MANAGE = ['admin', 'payroll_manager'];

export default function PayrollHistory() {
  const { user } = useAuth();
  const canManage = CAN_MANAGE.includes(user.role);

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [filters, setFilters] = useState({ employee: '', department: '', month: '', year: '', status: '' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingId, setGeneratingId] = useState(null);

  useEffect(() => {
    if (canManage) {
      employeeService.getEmployees({ limit: 100 }).then((res) => setEmployees(res.data.data)).catch(() => {});
      departmentService.getDepartments().then((res) => setDepartments(res.data.data)).catch(() => {});
    }
  }, [canManage]);

  const load = () => {
    setLoading(true);
    setError('');
    const params = { ...filters, page, limit: 10 };
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
    payrollService
      .getPayrolls(params)
      .then((res) => {
        setRecords(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filters, page]);

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const handleGeneratePayslip = async (payrollId) => {
    setGeneratingId(payrollId);
    try {
      await payslipService.generatePayslip(payrollId);
      toast.success('Payslip generated. Find it under the Payslips page.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGeneratingId(null);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Payroll History</h1>
        <p className="text-sm text-gray-500">Browse previously processed payroll records.</p>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3">
          {canManage && (
            <Select value={filters.employee} onChange={(e) => updateFilter('employee', e.target.value)} className="w-56">
              <option value="">All Employees</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>
              ))}
            </Select>
          )}
          {canManage && (
            <Select value={filters.department} onChange={(e) => updateFilter('department', e.target.value)} className="w-48">
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </Select>
          )}
          <Select value={filters.month} onChange={(e) => updateFilter('month', e.target.value)} className="w-40">
            <option value="">All Months</option>
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </Select>
          <Select value={filters.year} onChange={(e) => updateFilter('year', e.target.value)} className="w-28">
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          <Select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className="w-40">
            <option value="">All Statuses</option>
            <option>Draft</option>
            <option>Pending</option>
            <option>Processed</option>
            <option>Paid</option>
          </Select>
        </div>
      </Card>

      <Card noPadding>
        {loading ? (
          <Spinner label="Loading payroll history..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : records.length === 0 ? (
          <EmptyState title="No payroll records available for this period." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="px-5 py-3">Payroll ID</th>
                    {canManage && <th className="px-5 py-3">Employee</th>}
                    <th className="px-5 py-3">Pay Period</th>
                    <th className="px-5 py-3 text-right">Gross Salary</th>
                    <th className="px-5 py-3 text-right">Deductions</th>
                    <th className="px-5 py-3 text-right">Net Salary</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Processed Date</th>
                    {canManage && <th className="px-5 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-xs text-gray-400">{p._id.slice(-8).toUpperCase()}</td>
                      {canManage && (
                        <td className="px-5 py-3 font-medium text-gray-800">
                          {p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : '-'}
                        </td>
                      )}
                      <td className="px-5 py-3 text-gray-600">{monthLabel(p.month, p.year)}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{formatCurrency(p.grossSalary)}</td>
                      <td className="px-5 py-3 text-right text-red-500">{formatCurrency(p.totalDeductions)}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(p.netSalary)}</td>
                      <td className="px-5 py-3"><Badge status={p.status}>{p.status}</Badge></td>
                      <td className="px-5 py-3 text-gray-400">{formatDate(p.processedDate)}</td>
                      {canManage && (
                        <td className="px-5 py-3 text-right">
                          {p.status !== 'Draft' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={FileText}
                              loading={generatingId === p._id}
                              onClick={() => handleGeneratePayslip(p._id)}
                            >
                              Payslip
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
