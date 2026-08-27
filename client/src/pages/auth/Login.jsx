import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { Label, Input, FormGroup, FieldError } from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@northbridge-tech.com', password: 'Admin@12345' },
  { role: 'Payroll Manager', email: 'payroll.manager@northbridge-tech.com', password: 'Payroll@12345' },
  { role: 'Employee', email: 'employee@northbridge-tech.com', password: 'Employee@12345' },
];

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (user) {
    const dest = location.state?.from?.pathname || '/';
    return <Navigate to={dest} replace />;
  }

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = 'Email is required.';
    if (!password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      toast.success(`Welcome back, ${result.user.name.split(' ')[0]}!`);
      navigate('/', { replace: true });
    } else {
      toast.error(result.message);
    }
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setErrors({});
  };

  return (
    <AuthLayout title="Sign in to your account" subtitle="Enter your credentials to access the dashboard.">
      <form onSubmit={handleSubmit} noValidate>
        <FormGroup>
          <Label required>Email address</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="email"
              className="pl-9"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
          </div>
          <FieldError>{errors.email}</FieldError>
        </FormGroup>

        <FormGroup>
          <div className="flex items-center justify-between">
            <Label required>Password</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="password"
              className="pl-9"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
          </div>
          <FieldError>{errors.password}</FieldError>
        </FormGroup>

        <Button type="submit" icon={LogIn} className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 border-t border-gray-100 pt-5">
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-gray-400">Demo accounts</p>
        <div className="grid grid-cols-1 gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              onClick={() => fillDemo(acc)}
              type="button"
              className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-xs hover:border-brand-300 hover:bg-brand-50/40"
            >
              <span className="font-medium text-gray-700">{acc.role}</span>
              <span className="text-gray-400">{acc.email}</span>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
