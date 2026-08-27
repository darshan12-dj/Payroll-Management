import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Send, ArrowLeft } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { Label, Input, FormGroup, FieldError } from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import * as authService from '../../services/authService';
import { getErrorMessage } from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setSent(true);
      setDevResetUrl(res.data.devResetUrl || '');
      toast.success('If that account exists, a reset link has been sent.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll send you a reset link.">
      {sent ? (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            If an account exists for <strong>{email}</strong>, a password reset link has been sent.
          </p>
          {devResetUrl && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-800">
              <p className="mb-1 font-semibold">Local development mode</p>
              <p className="mb-2">No email service is configured, so here is your reset link directly:</p>
              <Link to={devResetUrl.replace(window.location.origin, '')} className="break-all underline">
                {devResetUrl}
              </Link>
            </div>
          )}
          <Link to="/login" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
        </div>
      ) : (
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
                error={error}
              />
            </div>
            <FieldError>{error}</FieldError>
          </FormGroup>
          <Button type="submit" icon={Send} className="w-full" loading={loading}>
            Send reset link
          </Button>
          <Link to="/login" className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
