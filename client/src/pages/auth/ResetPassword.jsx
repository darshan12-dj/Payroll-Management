import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, KeyRound } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { Label, Input, FormGroup, FieldError } from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import * as authService from '../../services/authService';
import { getErrorMessage } from '../../services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      toast.success('Password reset successfully. Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password for your account.">
      <form onSubmit={handleSubmit} noValidate>
        <FormGroup>
          <Label required>New password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="password"
              className="pl-9"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
          </div>
          <FieldError>{errors.password}</FieldError>
        </FormGroup>
        <FormGroup>
          <Label required>Confirm new password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="password"
              className="pl-9"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
            />
          </div>
          <FieldError>{errors.confirmPassword}</FieldError>
        </FormGroup>
        <Button type="submit" icon={KeyRound} className="w-full" loading={loading}>
          Reset password
        </Button>
        <Link to="/login" className="mt-4 block text-center text-sm font-medium text-gray-500 hover:text-gray-700">
          Back to login
        </Link>
      </form>
    </AuthLayout>
  );
}
