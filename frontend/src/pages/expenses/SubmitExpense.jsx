import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { Send, Paperclip, ScanLine } from 'lucide-react';

const COMMON_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'CHF', 'SGD',
  'AED', 'BRL', 'MXN', 'KRW', 'SEK', 'NOK', 'NZD', 'ZAR', 'HKD', 'THB',
];

export default function SubmitExpense() {
  const { user, company } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    category: '',
    paid_by: 'EMPLOYEE',
    amount: '',
    currency: company?.default_currency || 'USD',
    remarks: '',
    is_manager_approver: false,
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Enter a valid amount'); return; }
    if (!form.category) { setError('Select a category'); return; }

    setLoading(true);
    try {
      await client.post('/expenses', {
        amount: parseFloat(form.amount),
        currency: form.currency,
        category: form.category,
        description: form.description,
        remarks: form.remarks || null,
        paid_by: form.paid_by,
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
      {/* Header with status indicator */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-navy">
          Submit expense
        </h1>
        <StatusBar current="DRAFT" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Top bar: Attach Receipt + Scan */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                <Paperclip size={16} />
                {receiptFile ? receiptFile.name : 'Attach receipt'}
                <input type="file" accept="image/*,.pdf" className="hidden"
                  onChange={(e) => setReceiptFile(e.target.files[0] || null)} />
              </label>
              <Link to="/expenses/scan"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                <ScanLine size={16} /> Scan receipt
              </Link>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Row 1: Description + Expense Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <input type="text" name="description" required value={form.description} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                    placeholder="What was this expense for?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Expense date</label>
                  <input type="date" name="expense_date" required value={form.expense_date} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm" />
                </div>
              </div>

              {/* Row 2: Category + Paid by */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select name="category" required value={form.category} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white text-sm">
                    <option value="">Select category</option>
                    {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Paid by</label>
                  <select name="paid_by" value={form.paid_by} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white text-sm">
                    <option value="EMPLOYEE">Employee (personal)</option>
                    <option value="COMPANY">Company card</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Amount + Currency */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Total amount{' '}
                    <span className="text-xs text-gray-400 font-normal">
                      (in the currency you paid)
                    </span>
                  </label>
                  <input type="number" name="amount" required step="0.01" min="0.01"
                    value={form.amount} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                    placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                  <select name="currency" value={form.currency} onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white text-sm">
                    {COMMON_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {form.currency !== (company?.default_currency || 'USD') && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                  This amount will be auto-converted to {company?.default_currency || 'USD'} using today's exchange rate for your manager's approval view.
                </p>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
                <textarea name="remarks" rows={3} value={form.remarks} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm resize-none"
                  placeholder="Additional notes or context (optional)" />
              </div>

              {/* Manager toggle */}
              {hasManager && (
                <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" name="is_manager_approver" checked={form.is_manager_approver} onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-400" />
                  <div>
                    <p className="text-sm font-medium text-navy">Require manager approval first</p>
                    <p className="text-[11px] text-gray-500">Request goes to your manager before other approvers</p>
                  </div>
                </label>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 bg-primary-400 hover:bg-primary-500 text-navy font-semibold rounded-lg transition-colors text-sm disabled:opacity-50">
                <Send size={16} />
                {loading ? 'Submitting...' : 'Submit'}
              </button>

              <p className="text-[11px] text-gray-400 text-center">
                Once submitted, this record becomes read-only and enters the approval workflow.
              </p>
            </form>
          </div>
        </div>

        {/* Side info */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-display text-sm font-bold uppercase text-navy mb-3">Currency info</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your company's base currency is <strong className="text-navy">{company?.default_currency || 'USD'}</strong>.
              Submit in any currency — it will be auto-converted with real-time exchange rates for your manager's approval dashboard.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-display text-sm font-bold uppercase text-navy mb-3">Status flow</h3>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 font-semibold">Draft</span>
              <span className="text-gray-300">→</span>
              <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 font-semibold">Waiting approval</span>
              <span className="text-gray-300">→</span>
              <span className="px-2 py-1 rounded bg-green-100 text-green-700 font-semibold">Approved</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatusBar({ current }) {
  const steps = [
    { key: 'DRAFT', label: 'Draft' },
    { key: 'PENDING', label: 'Waiting approval' },
    { key: 'APPROVED', label: 'Approved' },
  ];
  const currentIdx = steps.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center gap-1">
          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            i <= currentIdx
              ? i === currentIdx
                ? 'bg-navy text-white'
                : 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-400'
          }`}>
            {step.label}
          </span>
          {i < steps.length - 1 && <span className="text-gray-300 text-xs">›</span>}
        </div>
      ))}
    </div>
  );
}
