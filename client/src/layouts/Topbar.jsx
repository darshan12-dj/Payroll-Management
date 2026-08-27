import { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, LogOut, UserCircle, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlobalSearch from '../components/common/GlobalSearch';
import NotificationDropdown from '../components/common/NotificationDropdown';
import { initials } from '../utils/format';

const ROLE_LABELS = { admin: 'Administrator', payroll_manager: 'Payroll Manager', employee: 'Employee' };

export default function Topbar({ onOpenMobileMenu }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [firstName, lastName] = (user?.name || '').split(' ');

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-6">
      <button className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden" onClick={onOpenMobileMenu}>
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden flex-1 md:block">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <NotificationDropdown />

        <div ref={menuRef} className="relative">
          <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {initials(firstName, lastName)}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-none text-gray-800">{user?.name}</p>
              <p className="mt-0.5 text-[11px] text-gray-400">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-30 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate(user?.role === 'employee' ? '/my-profile' : '/settings');
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <UserCircle className="h-4 w-4" /> My Profile
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings');
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" /> Settings
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
