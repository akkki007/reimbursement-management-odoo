import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import client from '../../api/client';
import { formatCurrency } from '../../utils/formatCurrency';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { ClipboardCheck, ChevronRight, Inbox } from 'lucide-react';

export default function ApprovalQueue() {
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get('/approvals/pending')
      .then(({ data }) => setPending(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-navy">
          Approval queue
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {pending.length} expense{pending.length !== 1 ? 's' : ''} awaiting your review
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading...</div>
        ) : pending.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="text-sm font-medium text-gray-500">All caught up</p>
            <p className="text-xs text-gray-400 mt-1">No expenses need your approval right now</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Step</th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {pending.map((item) => {
                const catLabel = EXPENSE_CATEGORIES.find((c) => c.value === item.category)?.label || item.category;
                return (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/approvals/${item.id}`)}
                    className="border-b border-gray-50 hover:bg-primary-50/20 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-navy">{item.submitted_by_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 truncate max-w-[200px]">{item.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md font-medium">
                        {catLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-semibold text-navy">
                        {formatCurrency(item.converted_amount || item.amount, item.converted_amount ? 'USD' : item.currency)}
                      </p>
                      {item.converted_amount && (
                        <p className="text-[11px] text-gray-400">
                          {formatCurrency(item.amount, item.currency)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(item.expense_date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 bg-primary-100 px-2.5 py-1 rounded-md">
                        <ClipboardCheck size={12} />
                        {item.current_step_label || `Step ${item.current_step_order + 1}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <ChevronRight size={16} className="text-gray-300" />
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
