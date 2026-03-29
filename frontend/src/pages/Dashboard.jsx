import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Dashboard() {
  const { user, company } = useAuth();

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {user?.first_name}! Here&apos;s your overview.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Pending Expenses" value="0" color="bg-primary-50" iconColor="bg-primary-400" />
        <StatCard label="Approved" value="0" color="bg-green-50" iconColor="bg-green-400" />
        <StatCard label="Rejected" value="0" color="bg-red-50" iconColor="bg-red-400" />
        <StatCard label="Total Submitted" value="0" color="bg-blue-50" iconColor="bg-blue-400" />
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <p className="text-gray-400 text-sm">No recent activity yet.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {user?.role === 'EMPLOYEE' ? 'Quick Actions' : 'Pending Approvals'}
          </h2>
          <p className="text-gray-400 text-sm">Nothing to show yet.</p>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, color, iconColor }) {
  return (
    <div className={`${color} rounded-2xl p-5 border border-gray-100`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 ${iconColor} rounded-lg`} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}
