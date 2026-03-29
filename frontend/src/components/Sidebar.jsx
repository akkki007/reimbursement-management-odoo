import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  ClipboardCheck,
  Users,
  Settings,
  Shield,
  LogOut,
  ScanLine,
} from 'lucide-react';

const iconNavClass = ({ isActive }) =>
  `flex items-center justify-center w-11 h-11 rounded-full transition-colors shrink-0 ${
    isActive
      ? 'bg-primary-400 text-navy shadow-sm'
      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
  }`;

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`;

  return (
    <aside className="fixed left-0 top-0 h-screen w-[72px] bg-white border-r border-gray-200 flex flex-col items-center z-30 pt-3 pb-4">
      <NavLink
        to="/dashboard"
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg text-xl font-display font-bold text-primary-500"
        title="Home"
      >
        r
      </NavLink>

      <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto px-1 py-1">
        <NavLink to="/dashboard" className={iconNavClass} title="Dashboard">
          <LayoutDashboard size={20} strokeWidth={1.75} />
        </NavLink>

        <NavLink to="/expenses/submit" className={iconNavClass} title="Submit expense">
          <PlusCircle size={20} strokeWidth={1.75} />
        </NavLink>

        <NavLink to="/expenses/scan" className={iconNavClass} title="Scan receipt">
          <ScanLine size={20} strokeWidth={1.75} />
        </NavLink>

        <NavLink to="/expenses" className={iconNavClass} title="My expenses">
          <Receipt size={20} strokeWidth={1.75} />
        </NavLink>

        {isManagerOrAdmin && (
          <NavLink to="/approvals" className={iconNavClass} title="Approvals">
            <ClipboardCheck size={20} strokeWidth={1.75} />
          </NavLink>
        )}

        {isAdmin && (
          <>
            <div className="my-2 h-px w-8 bg-gray-200" aria-hidden />
            <NavLink to="/admin/users" className={iconNavClass} title="Users">
              <Users size={20} strokeWidth={1.75} />
            </NavLink>
            <NavLink to="/admin/rules" className={iconNavClass} title="Approval rules">
              <Shield size={20} strokeWidth={1.75} />
            </NavLink>
            <NavLink to="/admin/settings" className={iconNavClass} title="Company settings">
              <Settings size={20} strokeWidth={1.75} />
            </NavLink>
          </>
        )}
      </nav>

      <div className="relative mt-auto flex flex-col items-center gap-3 pt-2">
        <div
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#3b82f6] text-sm font-semibold text-white"
          title={`${user?.first_name} ${user?.last_name}`}
        >
          {initials}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
          title="Sign out"
        >
          <LogOut size={18} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}
