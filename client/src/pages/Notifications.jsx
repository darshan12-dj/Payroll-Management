import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Bell } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import * as notificationService from '../services/notificationService';
import { formatDateTime } from '../utils/format';
import { getErrorMessage } from '../services/api';
import clsx from 'clsx';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    setError('');
    notificationService
      .getNotifications()
      .then((res) => setNotifications(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleClick = async (n) => {
    if (!n.isRead) {
      await notificationService.markAsRead(n._id);
      load();
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = async () => {
    await notificationService.markAllAsRead();
    load();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">Stay up to date with payroll, leave, and employee activity.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" icon={CheckCheck} onClick={handleMarkAll}>
            Mark all as read
          </Button>
        )}
      </div>

      <Card noPadding>
        {loading ? (
          <Spinner label="Loading notifications..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications yet" message="You're all caught up." />
        ) : (
          <div>
            {notifications.map((n) => (
              <button
                key={n._id}
                onClick={() => handleClick(n)}
                className={clsx(
                  'block w-full border-b border-gray-50 px-5 py-4 text-left last:border-0 hover:bg-gray-50',
                  !n.isRead && 'bg-brand-50/40'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="mt-0.5 text-sm text-gray-500">{n.message}</p>
                  </div>
                  {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                </div>
                <p className="mt-1.5 text-xs text-gray-400">{formatDateTime(n.createdAt)}</p>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
