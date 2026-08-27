import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, Download, FileText } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import { Select } from '../../components/ui/FormField';
import PayslipViewerModal from '../../components/payroll/PayslipViewerModal';
import { useAuth } from '../../context/AuthContext';
import * as payslipService from '../../services/payslipService';
import * as employeeService from '../../services/employeeService';
import { formatCurrency, monthLabel, MONTH_NAMES } from '../../utils/format';
import { getErrorMessage } from '../../services/api';

const CAN_MANAGE = ['admin', 'payroll_manager'];

export default function Payslips() {
  const { user } = useAuth();
  const canManage = CAN_MANAGE.includes(user.role);

  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ employee: '', month: '', year: '' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (canManage) {
      employeeService.getEmployees({ limit: 100 }).then((res) => setEmployees(res.data.data)).catch(() => {});
    }
  }, [canManage]);

  const load = () => {
    setLoading(true);
    setError('');
    const params = { ...filters, page, limit: 10 };
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
    payslipService
      .getPayslips(params)
      .then((res) => {
        setPayslips(res.data.data);
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

  const handleDownload = async (payslip) => {
    setDownloadingId(payslip._id);
    try {
      await payslipService.downloadPayslip(payslip._id, payslip.payslipNumber);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloadingId(null);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Payslips</h1>
        <p className="text-sm text-gray-500">View, print, and download generated payslips.</p>
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
        </div>
      </Card>

      <Card noPadding>
        {loading ? (
          <Spinner label="Loading payslips..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : payslips.length === 0 ? (
          <EmptyState icon={FileText} title="No payslips available" message="Payslips will appear here after payroll is processed and generated." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="px-5 py-3">Payslip #</th>
                    {canManage && <th className="px-5 py-3">Employee</th>}
                    <th className="px-5 py-3">Pay Period</th>
                    <th className="px-5 py-3 text-right">Net Salary</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payslips.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{p.payslipNumber}</td>
                      {canManage && (
                        <td className="px-5 py-3 font-medium text-gray-800">
                          {p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : '-'}
                        </td>
                      )}
                      <td className="px-5 py-3 text-gray-600">{monthLabel(p.month, p.year)}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(p.payroll?.netSalary)}</td>
                      <td className="px-5 py-3"><Badge status={p.payroll?.status}>{p.payroll?.status}</Badge></td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="secondary" icon={Eye} onClick={() => setViewing(p)}>
                            View
                          </Button>
                          <Button size="sm" variant="secondary" icon={Download} loading={downloadingId === p._id} onClick={() => handleDownload(p)}>
                            Download
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
          </>
        )}
      </Card>

      <PayslipViewerModal open={!!viewing} onClose={() => setViewing(null)} payslip={viewing} />
    </div>
  );
}
