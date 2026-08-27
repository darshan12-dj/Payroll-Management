import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <ShieldAlert className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Access denied</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        You don't have permission to view this page. If you believe this is a mistake, contact your administrator.
      </p>
      <Button className="mt-6" icon={ArrowLeft} onClick={() => navigate(-1)}>
        Go back
      </Button>
      <Link to="/" className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700">
        Return to dashboard
      </Link>
    </div>
  );
}
