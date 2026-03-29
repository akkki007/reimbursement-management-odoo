import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { Save, Building2 } from 'lucide-react';

export default function CompanySettings() {
  const { company, fetchMe } = useAuth();
  const [form, setForm] = useState({ name: '', default_currency: '' });
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (company) {
      setForm({ name: company.name, default_currency: company.default_currency });
    }
    client.get('/company/currencies').then(({ data }) => {
      const unique = [...new Set(data.map((c) => c.currency))].sort();
      setCurrencies(unique);
    }).catch(() => {});
  }, [company]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setLoading(true);
    try {
      await client.patch('/company', form);
      await fetchMe();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-navy">
          Company settings
        </h1>
        <p className="mt-2 text-sm text-gray-600">Manage your company profile and preferences</p>
      </div>

      <div className="max-w-xl">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <Building2 size={20} className="text-primary-700" />
            </div>
            <div>
              <p className="text-sm font-bold text-navy">{company?.name}</p>
              <p className="text-xs text-gray-500">{company?.country}</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>
          )}
          {saved && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100">
              Settings saved successfully
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Default currency</label>
              <select
                value={form.default_currency}
                onChange={(e) => setForm((f) => ({ ...f, default_currency: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white text-sm"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1.5">
                All expenses will be converted to this currency for reporting
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
              <input
                type="text"
                value={company?.country || ''}
                disabled
                className="w-full px-4 py-2.5 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1.5">Country is set during signup and cannot be changed</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-400 hover:bg-primary-500 text-navy font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              <Save size={16} />
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
