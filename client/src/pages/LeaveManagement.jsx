import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Check, X, CalendarClock } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Pagination from '../components/ui/Pagination';
import { Select } from '../components/ui/FormField';
import ApplyLeaveModal from '../components/leave/ApplyLeaveModal';
import { useAuth } from '../context/AuthContext';
import * as leaveService from '../services/leaveService';
import { formatDate } from '../utils/format';
import { getErrorMessage } from '../services/api';

const CAN_MANAGE = ['admin', 'payroll_manager'];

export default function LeaveManagement() {
  const { user } = useAuth();
  const canManage = CAN_MANAGE.includes(user.role);
  const employeeId = user.employee?._id || user.employee;

  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyOpen, setApplyOpen] = useState(false);
  const [actioningId, setActioningId] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    leaveService
      .getLeaves({ status, page, limit: 10 })
      .then((res) => {
        setLeaves(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, page]);

  const handleApprove = async (id) => {
    setActioningId(id);
    try {
      await leaveService.approveLeave(id);
      toast.success('Leave request approved.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id) => {
    setActioningId(id);
    try {
      await leaveService.rejectLeave(id);
      toast.success('Leave request rejected.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-sm text-gray-500">{canManage ? 'Review and manage leave requests.' : 'Apply for leave and track your requests.'}</p>
        </div>
        {employeeId && (
          <Button icon={Plus} onClick={() => setApplyOpen(true)}>
            Apply for Leave
          </Button>
        )}
      </div>

      <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-48">
        <option value="">All Statuses</option>
        <option value="Pending">Pending</option>
        <option value="Approved">Approved</option>
        <option value="Rejected">Rejected</option>
      </Select>

      <Card noPadding>
        {loading ? (
          <Spinner label="Loading leave requests..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : leaves.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No leave requests" message="Leave requests will appear here." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    {canManage && <th className="px-5 py-3">Employee</th>}
                    <th className="px-5 py-3">Leave Type</th>
                    <th className="px-5 py-3">Start Date</th>
                    <th className="px-5 py-3">End Date</th>
                    <th className="px-5 py-3">Days</th>
                    <th className="px-5 py-3">Reason</th>
                    <th className="px-5 py-3">Status</th>
                    {canManage && <th className="px-5 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leaves.map((l) => (
                    <tr key={l._id} className="hover:bg-gray-50">
                      {canManage && (
                        <td className="px-5 py-3 font-medium text-gray-800">
                          {l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : '-'}
                          <div className="text-xs font-normal text-gray-400">{l.employee?.department?.name}</div>
                        </td>
                      )}
                      <td className="px-5 py-3 text-gray-600">{l.leaveType}</td>
                      <td className="px-5 py-3 text-gray-500">{formatDate(l.startDate)}</td>
                      <td className="px-5 py-3 text-gray-500">{formatDate(l.endDate)}</td>
                      <td className="px-5 py-3 text-gray-600">{l.days}</td>
                      <td className="max-w-[200px] truncate px-5 py-3 text-gray-500" title={l.reason}>{l.reason}</td>
                      <td className="px-5 py-3"><Badge status={l.status}>{l.status}</Badge></td>
                      {canManage && (
                        <td className="px-5 py-3">
                          {l.status === 'Pending' ? (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="success" icon={Check} loading={actioningId === l._id} onClick={() => handleApprove(l._id)}>
                                Approve
                              </Button>
                              <Button size="sm" variant="danger" icon={X} loading={actioningId === l._id} onClick={() => handleReject(l._id)}>
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="block text-right text-xs text-gray-400">
                              {l.actionDate ? formatDate(l.actionDate) : '-'}
                            </span>
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

      {employeeId && (
        <ApplyLeaveModal open={applyOpen} onClose={() => setApplyOpen(false)} employeeId={employeeId} onSaved={load} />
      )}
    </div>
  );
}
