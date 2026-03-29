import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { Send, ScanLine, Upload } from 'lucide-react';

const COMMON_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'CHF', 'SGD',
  'AED', 'BRL', 'MXN', 'KRW', 'SEK', 'NOK', 'NZD', 'ZAR', 'HKD', 'THB',
];

export default function SubmitExpense() {
  const { user, company } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    amount: '',
    currency: company?.default_currency || 'USD',
    category: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    is_manager_approver: false,
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!form.category) {
      setError('Please select a category');
      return;
    }

    setLoading(true);
    try {
      await client.post('/expenses', {
        amount: parseFloat(form.amount),
        currency: form.currency,
        category: form.category,
        description: form.description,
        expense_date: new Date(form.expense_date).toISOString(),
        is_manager_approver: form.is_manager_approver,
      });
      navigate('/expenses');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit expense');
    } finally {
      setLoading(false);
    }
  };

  const hasManager = !!user?.manager_id;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-navy">
            Submit expense
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Fill in the details below or{' '}
            <Link to="/expenses/scan" className="text-primary-600 font-semibold hover:underline">
              scan a receipt
            </Link>
            {' '}to auto-fill.
          </p>
        </div>
        <Link
          to="/expenses/scan"
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          <ScanLine size={18} />
          Scan receipt
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {error && (
              <div className="mb-5 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Amount + Currency row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    step="0.01"
                    min="0.01"
                    value={form.amount}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white text-sm"
                  >
                    {COMMON_CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select
                  name="category"
                  required
                  value={form.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white text-sm"
                >
                  <option value="">Select a category</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  value={form.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm resize-none"
                  placeholder="What was this expense for?"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Expense date</label>
                <input
                  type="date"
                  name="expense_date"
                  required
                  value={form.expense_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm"
                />
              </div>

              {/* Receipt upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Receipt <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors">
                  <Upload size={18} className="text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {receiptFile ? receiptFile.name : 'Click to upload receipt image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => setReceiptFile(e.target.files[0] || null)}
                  />
                </label>
              </div>

              {/* Manager approval toggle */}
              {hasManager && (
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
                  <input
                    type="checkbox"
                    id="is_manager_approver"
                    name="is_manager_approver"
                    checked={form.is_manager_approver}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-400"
                  />
                  <label htmlFor="is_manager_approver" className="text-sm text-gray-700">
                    <span className="font-medium">Require manager approval first</span>
                    <br />
                    <span className="text-xs text-gray-500">
                      Your direct manager will review before other approvers
                    </span>
                  </label>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-400 hover:bg-primary-500 text-navy font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                <Send size={16} />
                {loading ? 'Submitting...' : 'Submit expense'}
              </button>
            </form>
          </div>
        </div>

        {/* Side panel - info */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-display text-sm font-bold uppercase text-navy mb-3">Currency info</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your company's default currency is <strong className="text-navy">{company?.default_currency || 'USD'}</strong>.
              If you submit in a different currency, it will be automatically converted using the latest exchange rate.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-display text-sm font-bold uppercase text-navy mb-3">Approval workflow</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              After submission, your expense enters the approval pipeline. You'll be notified when it's approved or if changes are needed.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-display text-sm font-bold uppercase text-navy mb-3">Tips</h3>
            <ul className="text-xs text-gray-500 space-y-2 leading-relaxed">
              <li>• Attach receipts to speed up approval</li>
              <li>• Use the scanner for automatic field detection</li>
              <li>• Add clear descriptions for faster reviews</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
