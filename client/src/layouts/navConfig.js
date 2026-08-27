import {
  LayoutDashboard, Users, Building2, CalendarCheck, CalendarClock, Wallet,
  Banknote, FileText, BarChart3, Bell, Settings, UserCircle,
} from 'lucide-react';

// Single source of truth for sidebar links + which roles can see them.
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'payroll_manager'] },
  { to: '/my-profile', label: 'My Profile', icon: UserCircle, roles: ['employee'] },
  { to: '/employees', label: 'Employees', icon: Users, roles: ['admin', 'payroll_manager'] },
  { to: '/departments', label: 'Departments', icon: Building2, roles: ['admin'] },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['admin', 'payroll_manager', 'employee'] },
  { to: '/leave', label: 'Leave Management', icon: CalendarClock, roles: ['admin', 'payroll_manager', 'employee'] },
  { to: '/salary-structure', label: 'Salary Structure', icon: Wallet, roles: ['admin', 'payroll_manager'] },
  { to: '/payroll', label: 'Payroll', icon: Banknote, roles: ['admin', 'payroll_manager'] },
  { to: '/payroll-history', label: 'Payroll History', icon: FileText, roles: ['admin', 'payroll_manager', 'employee'] },
  { to: '/payslips', label: 'Payslips', icon: FileText, roles: ['admin', 'payroll_manager', 'employee'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'payroll_manager'] },
  { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'payroll_manager', 'employee'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'payroll_manager', 'employee'] },
];
