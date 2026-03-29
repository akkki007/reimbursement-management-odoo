import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import client from '../api/client';
import { formatCurrency } from '../utils/formatCurrency';
import { Clock, CheckCircle2, XCircle, FileStack, MoreVertical, Download } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const defaultChartData = [
  { m: 'Jan', v: 0 },
  { m: 'Feb', v: 0 },
  { m: 'Mar', v: 0 },
  { m: 'Apr', v: 0 },
  { m: 'May', v: 0 },
  { m: 'Jun', v: 0 },
  { m: 'Jul', v: 0 },
];

export default function Dashboard() {
  const { user, company } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    client.get('/expenses/stats').then(({ data }) => setStats(data)).catch(() => {});
    client.get('/expenses?limit=5').then(({ data }) => setRecent(Array.isArray(data) ? data.slice(0, 5) : [])).catch(() => {});
  }, []);

  const counts = stats?.counts || {};
  const pendingCount = (counts.PENDING || 0) + (counts.IN_PROGRESS || 0);
  const currency = company?.default_currency || 'USD';

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-navy">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back, {user?.first_name}. Here&apos;s your overview.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending expenses"
          value={pendingCount}
          icon={<Clock className="h-5 w-5 text-white" />}
          iconBg="bg-amber-500"
        />
        <StatCard
          label="Approved"
          value={counts.APPROVED || 0}
          icon={<CheckCircle2 className="h-5 w-5 text-white" />}
          iconBg="bg-emerald-500"
        />
        <StatCard
          label="Rejected"
          value={counts.REJECTED || 0}
          icon={<XCircle className="h-5 w-5 text-white" />}
          iconBg="bg-rose-500"
        />
        <StatCard
          label="Total submitted"
          value={stats?.total_submitted || 0}
          icon={<FileStack className="h-5 w-5 text-white" />}
          iconBg="bg-sky-500"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="font-display text-lg font-bold uppercase text-navy">Company expenses overview</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
              <button
                type="button"
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                aria-label="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={defaultChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis
                  tickFormatter={(v) => `$${v / 1000}k`}
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                  width={40}
                />
                <Tooltip
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Total']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#ca9f00"
                  strokeWidth={2}
                  dot={{ fill: '#ffcc00', stroke: '#1d2633', strokeWidth: 1, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Total cost</p>
              <p className="font-semibold text-navy">{formatCurrency(stats?.total_amount || 0, currency)}</p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-primary-400" />
                <span className="text-xs text-gray-600">Submitted</span>
                <span className="text-xs font-semibold text-navy">{stats?.total_submitted || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-gray-700" />
                <span className="text-xs text-gray-600">Approved</span>
                <span className="text-xs font-semibold text-navy">{counts.APPROVED || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold uppercase text-navy">Current period</h2>
          <div className="mt-8 flex flex-col items-center">
            <div
              className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-emerald-400/80 bg-emerald-50 text-sm font-semibold text-emerald-800"
              aria-hidden
            >
              {stats?.pending_approvals || 0} pending
            </div>
            {/* Recent expenses */}
            <div className="mt-8 w-full space-y-3">
              {recent.length === 0 ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2 rounded bg-gray-200" />
                      <div className="h-2 w-2/3 rounded bg-gray-100" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2 rounded bg-gray-200" />
                      <div className="h-2 w-1/2 rounded bg-gray-100" />
                    </div>
                  </div>
                </>
              ) : (
                recent.map((e) => (
                  <div key={e.id} className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${e.status === 'APPROVED' ? 'bg-emerald-400' : e.status === 'REJECTED' ? 'bg-red-400' : 'bg-amber-400'}`} />
                    <p className="flex-1 text-xs text-gray-700 truncate">{e.description}</p>
                    <p className="text-xs font-semibold text-navy shrink-0">{formatCurrency(e.amount, e.currency)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold uppercase text-navy">Activity log</h2>
          <div className="mt-6 space-y-3">
            {recent.length === 0 ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-2.5 rounded bg-gray-100" style={{ width: `${90 - i * 12}%` }} />
              ))
            ) : (
              recent.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${e.status === 'APPROVED' ? 'bg-green-100 text-green-700' : e.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {e.status}
                    </span>
                    <p className="text-xs text-gray-700 truncate max-w-[180px]">{e.description}</p>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold uppercase text-navy">
            {user?.role === 'EMPLOYEE' ? 'Quick summary' : 'Required action impacting payouts'}
          </h2>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Pending approval</span>
              <span className="text-sm font-bold text-navy">{pendingCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Approved this period</span>
              <span className="text-sm font-bold text-navy">{counts.APPROVED || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Total value</span>
              <span className="text-sm font-bold text-navy">{formatCurrency(stats?.total_amount || 0, currency)}</span>
            </div>
            {stats?.pending_approvals > 0 && (
              <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-800 font-medium">
                  You have {stats.pending_approvals} expense{stats.pending_approvals !== 1 ? 's' : ''} waiting for your approval
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, icon, iconBg }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>{icon}</div>
      </div>
      <p className="font-display text-3xl font-bold text-navy">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  );
}
