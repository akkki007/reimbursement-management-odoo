import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import client from '../../api/client';
import { Users, Plus, X, ChevronDown } from 'lucide-react';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const { data } = await client.get('/users');
      setUsers(data);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const managers = users.filter((u) => u.role === 'MANAGER' || u.role === 'ADMIN');

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-500 mt-1">{users.length} users in your company</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-400 hover:bg-primary-500 text-gray-900 font-semibold rounded-xl transition-colors"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
      )}

      {/* Create user modal */}
      {showCreate && (
        <CreateUserModal
          managers={managers}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchUsers();
          }}
        />
      )}

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Manager</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  allUsers={users}
                  managers={managers}
                  onUpdate={fetchUsers}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

function UserRow({ user, allUsers, managers, onUpdate }) {
  const [editingRole, setEditingRole] = useState(false);
  const [editingManager, setEditingManager] = useState(false);
  const managerName = user.manager_id
    ? (() => {
        const m = allUsers.find((u) => u.id === user.manager_id);
        return m ? `${m.first_name} ${m.last_name}` : '—';
      })()
    : '—';

  const handleRoleChange = async (role) => {
    try {
      await client.patch(`/users/${user.id}/role`, { role });
      onUpdate();
    } catch { /* ignore */ }
    setEditingRole(false);
  };

  const handleManagerChange = async (managerId) => {
    try {
      await client.patch(`/users/${user.id}/manager`, {
        manager_id: managerId || null,
      });
      onUpdate();
    } catch { /* ignore */ }
    setEditingManager(false);
  };

  const handleDeactivate = async () => {
    if (!window.confirm(`Deactivate ${user.first_name} ${user.last_name}?`)) return;
    try {
      await client.delete(`/users/${user.id}`);
      onUpdate();
    } catch { /* ignore */ }
  };

  return (
    <tr className="border-b border-gray-50 hover:bg-primary-50/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-700">
              {user.first_name[0]}{user.last_name[0]}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {editingRole ? (
          <select
            value={user.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            onBlur={() => setEditingRole(false)}
            autoFocus
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        ) : (
          <button
            onClick={() => setEditingRole(true)}
            className="flex items-center gap-1 text-sm text-gray-700 hover:text-primary-600"
          >
            <RoleBadge role={user.role} />
            <ChevronDown size={14} />
          </button>
        )}
      </td>
      <td className="px-6 py-4">
        {editingManager ? (
          <select
            value={user.manager_id || ''}
            onChange={(e) => handleManagerChange(e.target.value)}
            onBlur={() => setEditingManager(false)}
            autoFocus
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="">None</option>
            {managers
              .filter((m) => m.id !== user.id)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.first_name} {m.last_name}
                </option>
              ))}
          </select>
        ) : (
          <button
            onClick={() => setEditingManager(true)}
            className="text-sm text-gray-600 hover:text-primary-600"
          >
            {managerName}
          </button>
        )}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
            user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4">
        {user.is_active && (
          <button
            onClick={handleDeactivate}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Deactivate
          </button>
        )}
      </td>
    </tr>
  );
}

function RoleBadge({ role }) {
  const colors = {
    ADMIN: 'bg-purple-100 text-purple-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    EMPLOYEE: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${colors[role] || colors.EMPLOYEE}`}>
      {role}
    </span>
  );
}

function CreateUserModal({ managers, onClose, onCreated }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'EMPLOYEE',
    manager_id: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await client.post('/users', {
        ...form,
        manager_id: form.manager_id || null,
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Add New User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                name="first_name"
                required
                value={form.first_name}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                name="last_name"
                required
                value={form.last_name}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm bg-white"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
              <select
                name="manager_id"
                value={form.manager_id}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm bg-white"
              >
                <option value="">None</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary-400 hover:bg-primary-500 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  );
}
