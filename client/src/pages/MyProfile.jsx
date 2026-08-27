import { useAuth } from '../context/AuthContext';
import EmployeeProfile from './employees/EmployeeProfile';
import EmptyState from '../components/ui/EmptyState';

export default function MyProfile() {
  const { user } = useAuth();
  const employeeId = user?.employee?._id || user?.employee;

  if (!employeeId) {
    return (
      <EmptyState
        title="No employee record linked"
        message="Your account isn't linked to an employee profile yet. Contact HR to have one set up."
      />
    );
  }

  return <EmployeeProfile employeeIdOverride={employeeId} />;
}
