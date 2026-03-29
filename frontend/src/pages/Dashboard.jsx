import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
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

const chartData = [
  { m: 'Jan', v: 12000 },
  { m: 'Feb', v: 18000 },
  { m: 'Mar', v: 15000 },
  { m: 'Apr', v: 22000 },
  { m: 'May', v: 28000 },
  { m: 'Jun', v: 32000 },
  { m: 'Jul', v: 30000 },
];

export default function Dashboard() {
  const { user } = useAuth();

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
          value="0"
          icon={<Clock className="h-5 w-5 text-white" />}
          iconBg="bg-amber-500"
        />
        <StatCard
          label="Approved"
          value="0"
          icon={<CheckCircle2 className="h-5 w-5 text-white" />}
          iconBg="bg-emerald-500"
        />
        <StatCard
          label="Rejected"
          value="0"
          icon={<XCircle className="h-5 w-5 text-white" />}
          iconBg="bg-rose-500"
        />
        <StatCard
          label="Total submitted"
          value="0"
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
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              <p className="font-semibold text-navy">0</p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-primary-400" />
                <span className="text-xs text-gray-600">Submitted</span>
                <span className="text-xs font-semibold text-navy">0</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-gray-700" />
                <span className="text-xs text-gray-600">Approved</span>
                <span className="text-xs font-semibold text-navy">0</span>
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
              —
            </div>
            <div className="mt-8 w-full space-y-3">
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
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold uppercase text-navy">Activity log</h2>
          <div className="mt-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-2.5 rounded bg-gray-100" style={{ width: `${90 - i * 12}%` }} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold uppercase text-navy">
            Required action impacting payouts
          </h2>
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-2.5 rounded bg-gray-100" style={{ width: `${85 - i * 10}%` }} />
            ))}
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
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  );
}
