import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { Landmark, X } from 'lucide-react';
import { NAV_ITEMS } from './navConfig';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  const content = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Landmark className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-gray-900">PayrollPro</p>
          <p className="text-[11px] text-gray-400">Payroll Management</p>
        </div>
        <button className="ml-auto rounded p-1 text-gray-400 hover:bg-gray-100 lg:hidden" onClick={onCloseMobile}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-100 px-5 py-4 text-[11px] text-gray-400">
        &copy; {new Date().getFullYear()} PayrollPro. All rights reserved.
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 lg:block">{content}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
          <div className="relative z-10 h-full w-72 shadow-xl">{content}</div>
        </div>
      )}
    </>
  );
}
