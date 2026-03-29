import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { Upload, Plus, ChevronRight, FileText, ArrowRight, Send } from 'lucide-react';

const STATUS_BADGE = {
  DRAFT: 'border border-red-300 text-red-600 bg-red-50',
  PENDING: 'border border-amber-300 text-amber-700 bg-amber-50',
  IN_PROGRESS: 'border border-blue-300 text-blue-700 bg-blue-50',
  APPROVED: 'border border-green-300 text-green-700 bg-green-50',
  REJECTED: 'border border-red-300 text-red-600 bg-red-50',
};

const STATUS_LABEL = {
  DRAFT: 'Draft',
  PENDING: 'Submitted',
  IN_PROGRESS: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export default function ExpenseHistory() {
  const { user, company } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/expenses');
      setExpenses(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmitDraft = async (expenseId) => {
    setSubmitting(expenseId);
    try {
      await client.post(`/expenses/${expenseId}/submit`);
      fetchExpenses();
    } catch { /* ignore */ }
    finally { setSubmitting(null); }
  };

  // Summary totals
  const drafts = expenses.filter((e) => e.status === 'DRAFT');
  const waiting = expenses.filter((e) => e.status === 'PENDING' || e.status === 'IN_PROGRESS');
  const approved = expenses.filter((e) => e.status === 'APPROVED');
  const currency = company?.default_currency || 'INR';

  const sumAmount = (list) => list.reduce((acc, e) => acc + (e.converted_amount || e.amount), 0);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-navy">
          My expenses
        </h1>
        <div className="flex items-center gap-2">
          <Link to="/expenses/scan"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm">
            <Upload size={16} /> Upload
          </Link>
          <Link to="/expenses/submit"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-400 hover:bg-primary-500 text-navy font-semibold rounded-lg transition-colors text-sm">
            <Plus size={16} /> New
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard
          label="To submit"
          amount={sumAmount(drafts)}
          currency={currency}
          count={drafts.length}
          color="bg-red-50 border-red-200"
          textColor="text-red-700"
        />
        <SummaryCard
          label="Waiting approval"
          amount={sumAmount(waiting)}
          currency={currency}
          count={waiting.length}
          color="bg-amber-50 border-amber-200"
          textColor="text-amber-700"
        />
        <SummaryCard
          label="Approved"
          amount={sumAmount(approved)}
          currency={currency}
          count={approved.length}
          color="bg-green-50 border-green-200"
          textColor="text-green-700"
        />
      </div>

      {/* Expenses table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="text-sm text-gray-500">No expenses yet</p>
            <p className="text-xs text-gray-400 mt-1">Upload a receipt or create a new expense to get started</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid by</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => {
                const catLabel = EXPENSE_CATEGORIES.find((c) => c.value === expense.category)?.label || expense.category;
                const isDraft = expense.status === 'DRAFT';
                return (
                  <tr
                    key={expense.id}
                    onClick={() => !isDraft && navigate(`/approvals/${expense.id}`)}
                    className={`border-b border-gray-50 transition-colors ${isDraft ? '' : 'hover:bg-primary-50/20 cursor-pointer'}`}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-navy">{expense.submitted_by_name || `${user?.first_name} ${user?.last_name}`}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-gray-700 truncate max-w-[180px]">{expense.description}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {new Date(expense.expense_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{catLabel}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {expense.paid_by === 'COMPANY' ? 'Company' : user?.first_name || 'Self'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 truncate max-w-[120px]">
                      {expense.remarks || 'None'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-navy">
                      {formatCurrency(expense.amount, expense.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_BADGE[expense.status] || STATUS_BADGE.DRAFT}`}>
                          {STATUS_LABEL[expense.status] || expense.status}
                        </span>
                        {isDraft && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSubmitDraft(expense.id); }}
                            disabled={submitting === expense.id}
                            className="flex items-center gap-1 px-2 py-1 bg-navy text-white rounded-md text-[10px] font-semibold hover:bg-navy-muted transition-colors disabled:opacity-50"
                          >
                            <Send size={10} />
                            {submitting === expense.id ? '...' : 'Submit'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      {!isDraft && <ChevronRight size={14} className="text-gray-300" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

function SummaryCard({ label, amount, currency, count, color, textColor }) {
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-2xl font-bold text-navy">{formatCurrency(amount, currency)}</p>
        <ArrowRight size={16} className="text-gray-400" />
      </div>
      <p className={`text-xs font-semibold ${textColor}`}>
        {label} <span className="text-gray-400 font-normal">({count})</span>
      </p>
    </div>
  );
}
