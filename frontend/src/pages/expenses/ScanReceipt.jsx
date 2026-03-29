import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { Camera, Upload, ScanLine, Send, Loader2 } from 'lucide-react';

const COMMON_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'CHF', 'SGD',
  'AED', 'BRL', 'MXN', 'KRW', 'SEK', 'NOK', 'NZD', 'ZAR', 'HKD', 'THB',
];

export default function ScanReceipt() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    amount: '',
    currency: company?.default_currency || 'USD',
    category: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    vendor_name: '',
  });

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setScanned(false);
  };

  const handleScan = async () => {
    if (!file) return;
    setScanning(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await client.post('/expenses/scan-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.error) {
        setError(data.error);
      }

      setForm((prev) => ({
        ...prev,
        amount: data.amount ? String(data.amount) : prev.amount,
        currency: data.currency || prev.currency,
        category: data.category || prev.category,
        description: data.description || prev.description,
        expense_date: data.date || prev.expense_date,
        vendor_name: data.vendor_name || prev.vendor_name,
      }));
      setScanned(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'OCR scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.category) {
      setError('Amount and category are required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await client.post('/expenses', {
        amount: parseFloat(form.amount),
        currency: form.currency,
        category: form.category,
        description: form.description,
        expense_date: new Date(form.expense_date).toISOString(),
        is_manager_approver: false,
        ocr_vendor_name: form.vendor_name || null,
      });
      navigate('/expenses');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-navy">
          Scan receipt
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Upload or photograph a receipt to auto-fill expense fields
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload area */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Receipt" className="w-full max-h-[400px] object-contain bg-gray-50" />
                <button
                  onClick={() => { setFile(null); setPreview(null); setScanned(false); }}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-white"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-64 cursor-pointer hover:bg-primary-50/30 transition-colors">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <Camera size={22} />
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <Upload size={22} />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    Take a photo or upload receipt
                  </p>
                  <p className="text-xs text-gray-400">JPG, PNG, or PDF</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.pdf"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          {file && !scanned && (
            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center justify-center gap-2 w-full py-3 bg-navy hover:bg-navy-muted text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Scanning receipt...
                </>
              ) : (
                <>
                  <ScanLine size={16} />
                  Scan with OCR
                </>
              )}
            </button>
          )}

          {scanned && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              Receipt scanned successfully. Review and edit the fields, then submit.
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}
        </div>

        {/* Form - pre-filled from OCR */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-display text-sm font-bold uppercase text-navy mb-4">Expense details</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {form.vendor_name && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vendor</label>
                <input
                  type="text"
                  name="vendor_name"
                  value={form.vendor_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm bg-primary-50/30"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.amount}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm ${scanned && form.amount ? 'bg-primary-50/30' : ''}`}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white text-sm"
                >
                  {COMMON_CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select
                name="category"
                required
                value={form.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white text-sm"
              >
                <option value="">Select a category</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                name="description"
                required
                rows={3}
                value={form.description}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm resize-none ${scanned && form.description ? 'bg-primary-50/30' : ''}`}
                placeholder="What was this expense for?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                name="expense_date"
                required
                value={form.expense_date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-400 hover:bg-primary-500 text-navy font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              <Send size={16} />
              {submitting ? 'Submitting...' : 'Submit expense'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
