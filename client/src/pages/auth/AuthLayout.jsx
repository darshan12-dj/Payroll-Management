import { Landmark } from 'lucide-react';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
            <Landmark className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">PayrollPro</h1>
          <p className="mt-1 text-sm text-gray-500">Payroll Management System</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
