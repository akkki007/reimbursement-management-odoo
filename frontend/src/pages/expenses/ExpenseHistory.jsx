import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { EXPENSE_CATEGORIES, STATUS_COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { Filter, ChevronRight, FileText } from 'lucide-react';

export default function ExpenseHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.category) params.set('category', filters.category);
      const { data } = await client.get(`/expenses?${params.toString()}`);
      setExpenses(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const statusCounts = expenses.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-navy">
            My expenses
          </h1>
          <p className="mt-2 text-sm text-gray-600">{expenses.length} expense{expenses.length !== 1 ? 's' : ''} found</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-semibold transition-colors ${
            showFilters
              ? 'border-primary-400 bg-primary-50 text-navy'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter size={16} />
          Filters
        </button>
      </div>

      {/* Quick status tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['', 'PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'DRAFT'].map((s) => (
          <button
            key={s}
            onClick={() => setFilters((f) => ({ ...f, status: s }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filters.status === s
                ? 'bg-navy text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {s || 'All'} {s ? `(${statusCounts[s] || 0})` : `(${expenses.length})`}
          </button>
        ))}
      </div>

      {/* Extended filters */}
      {showFilters && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm mb-5 flex gap-4 flex-wrap items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="">All categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setFilters({ status: '', category: '' })}
            className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-navy"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Expense list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="text-sm text-gray-500">No expenses found</p>
            <p className="text-xs text-gray-400 mt-1">Submit your first expense to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                {user?.role !== 'EMPLOYEE' && (
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted by</th>
                )}
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr
                  key={expense.id}
                  onClick={() => navigate(`/approvals/${expense.id}`)}
                  className="border-b border-gray-50 hover:bg-primary-50/20 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-navy truncate max-w-[240px]">{expense.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md font-medium">
                      {EXPENSE_CATEGORIES.find((c) => c.value === expense.category)?.label || expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-semibold text-navy">{formatCurrency(expense.amount, expense.currency)}</p>
                    {expense.converted_amount && (
                      <p className="text-[11px] text-gray-400">
                        {formatCurrency(expense.converted_amount, expense.company_currency || 'USD')}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {new Date(expense.expense_date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${STATUS_COLORS[expense.status] || 'bg-gray-100 text-gray-700'}`}>
                      {expense.status.replace('_', ' ')}
                    </span>
                  </td>
                  {user?.role !== 'EMPLOYEE' && (
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{expense.submitted_by_name}</span>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <ChevronRight size={16} className="text-gray-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
