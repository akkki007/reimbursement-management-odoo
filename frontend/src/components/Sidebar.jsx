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

const navClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary-400 text-gray-900 shadow-sm'
      : 'text-gray-600 hover:bg-primary-50 hover:text-gray-900'
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

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="text-lg font-bold text-gray-900">ReimburseFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavLink to="/dashboard" className={navClass}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/expenses/submit" className={navClass}>
          <PlusCircle size={18} />
          Submit Expense
        </NavLink>

        <NavLink to="/expenses/scan" className={navClass}>
          <ScanLine size={18} />
          Scan Receipt
        </NavLink>

        <NavLink to="/expenses" className={navClass}>
          <Receipt size={18} />
          My Expenses
        </NavLink>

        {isManagerOrAdmin && (
          <NavLink to="/approvals" className={navClass}>
            <ClipboardCheck size={18} />
            Approvals
          </NavLink>
        )}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
            </div>
            <NavLink to="/admin/users" className={navClass}>
              <Users size={18} />
              Manage Users
            </NavLink>
            <NavLink to="/admin/rules" className={navClass}>
              <Shield size={18} />
              Approval Rules
            </NavLink>
            <NavLink to="/admin/settings" className={navClass}>
              <Settings size={18} />
              Company Settings
            </NavLink>
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-700">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
