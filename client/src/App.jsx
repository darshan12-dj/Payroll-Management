import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, RoleRoute } from './components/common/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Unauthorized from './pages/auth/Unauthorized';
import NotFound from './pages/NotFound';

import Dashboard from './pages/Dashboard';
import Employees from './pages/employees/Employees';
import EmployeeForm from './pages/employees/EmployeeForm';
import EmployeeProfile from './pages/employees/EmployeeProfile';
import MyProfile from './pages/MyProfile';
import Departments from './pages/Departments';
import Attendance from './pages/Attendance';
import LeaveManagement from './pages/LeaveManagement';
import SalaryStructure from './pages/SalaryStructure';
import Payroll from './pages/payroll/Payroll';
import PayrollHistory from './pages/payroll/PayrollHistory';
import Payslips from './pages/payroll/Payslips';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === 'employee') return <Navigate to="/my-profile" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<HomeRedirect />} />

              <Route element={<RoleRoute roles={['admin', 'payroll_manager']} />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="employees" element={<Employees />} />
                <Route path="salary-structure" element={<SalaryStructure />} />
                <Route path="payroll" element={<Payroll />} />
                <Route path="reports" element={<Reports />} />
              </Route>

              <Route element={<RoleRoute roles={['admin']} />}>
                <Route path="employees/new" element={<EmployeeForm />} />
                <Route path="employees/:id/edit" element={<EmployeeForm />} />
                <Route path="departments" element={<Departments />} />
              </Route>

              <Route element={<RoleRoute roles={['admin', 'payroll_manager']} />}>
                <Route path="employees/:id" element={<EmployeeProfile />} />
              </Route>

              <Route path="my-profile" element={<MyProfile />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="leave" element={<LeaveManagement />} />
              <Route path="payroll-history" element={<PayrollHistory />} />
              <Route path="payslips" element={<Payslips />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
