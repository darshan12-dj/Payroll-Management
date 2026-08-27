import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Pencil, Trash2, Users, ArrowUpDown } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Avatar from '../../components/common/Avatar';
import { Select } from '../../components/ui/FormField';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import * as employeeService from '../../services/employeeService';
import * as departmentService from '../../services/departmentService';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../services/api';

export default function Employees() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    departmentService.getDepartments().then((res) => setDepartments(res.data.data)).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    setError('');
    employeeService
      .getEmployees({ search: debouncedSearch, department, status, sortBy, sortOrder, page, limit: 10 })
      .then((res) => {
        setEmployees(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [debouncedSearch, department, status, sortBy, sortOrder, page]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await employeeService.deleteEmployee(deleteTarget._id);
      toast.success(`${deleteTarget.firstName} ${deleteTarget.lastName} has been deactivated.`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const SortHeader = ({ field, children }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1 font-medium hover:text-gray-700">
      {children} <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500">Manage your organization's workforce.</p>
        </div>
        {user.role === 'admin' && (
          <Button icon={Plus} onClick={() => navigate('/employees/new')}>
            Add Employee
          </Button>
        )}
      </div>

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, ID, email, position..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <Select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            className="sm:w-48"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="sm:w-40"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Terminated">Terminated</option>
          </Select>
        </div>

        {loading ? (
          <Spinner label="Loading employees..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : employees.length === 0 ? (
          <EmptyState icon={Users} title="No employees found." message="Try adjusting your search or filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="px-5 py-3"><SortHeader field="employeeId">ID</SortHeader></th>
                    <th className="px-5 py-3"><SortHeader field="firstName">Employee</SortHeader></th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Position</th>
                    <th className="px-5 py-3"><SortHeader field="joiningDate">Joined</SortHeader></th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3"><SortHeader field="basicSalary">Salary</SortHeader></th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{emp.employeeId}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={emp.profilePhoto} firstName={emp.firstName} lastName={emp.lastName} size={32} />
                          <div>
                            <p className="font-medium text-gray-800">{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs text-gray-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{emp.department?.name || '-'}</td>
                      <td className="px-5 py-3 text-gray-600">{emp.position}</td>
                      <td className="px-5 py-3 text-gray-500">{formatDate(emp.joiningDate)}</td>
                      <td className="px-5 py-3"><Badge status={emp.employmentStatus}>{emp.employmentStatus}</Badge></td>
                      <td className="px-5 py-3 font-medium text-gray-800">{formatCurrency(emp.basicSalary)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <button title="View" onClick={() => navigate(`/employees/${emp._id}`)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600">
                            <Eye className="h-4 w-4" />
                          </button>
                          {user.role === 'admin' && (
                            <>
                              <button title="Edit" onClick={() => navigate(`/employees/${emp._id}/edit`)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600">
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button title="Deactivate" onClick={() => setDeleteTarget(emp)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
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

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Deactivate employee?"
        message={`This will mark ${deleteTarget?.firstName} ${deleteTarget?.lastName} as Inactive. They will no longer appear as active for payroll processing.`}
        confirmLabel="Deactivate"
      />
    </div>
  );
}
