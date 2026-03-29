import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { STATUS_COLORS, EXPENSE_CATEGORIES } from '../../utils/constants';
import { ArrowLeft, Check, X, Clock, SkipForward, User } from 'lucide-react';

const STEP_ICON = {
  APPROVED: <Check size={14} />,
  REJECTED: <X size={14} />,
  AWAITING: <Clock size={14} />,
  PENDING: <Clock size={14} />,
  SKIPPED: <SkipForward size={14} />,
};

const STEP_COLOR = {
  APPROVED: 'bg-green-500 text-white',
  REJECTED: 'bg-red-500 text-white',
  AWAITING: 'bg-primary-400 text-navy',
  PENDING: 'bg-gray-200 text-gray-500',
  SKIPPED: 'bg-gray-300 text-gray-600',
};

export default function ApprovalDetail() {
  const { expenseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const fetchExpense = async () => {
    try {
      const { data } = await client.get(`/expenses/${expenseId}`);
      setExpense(data);
    } catch {
      setError('Failed to load expense');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpense();
  }, [expenseId]);

  const canAct =
    expense &&
    user &&
    (user.role === 'ADMIN' || user.role === 'MANAGER') &&
    expense.approval_steps?.some(
      (s) => s.approver_id === user.id && s.status === 'AWAITING'
    );

  const handleApprove = async () => {
    setActionLoading(true);
    setError('');
    try {
      await client.post(`/approvals/${expenseId}/approve`, { comment: comment || null });
      await fetchExpense();
      setComment('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      setError('Comment is required when rejecting');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await client.post(`/approvals/${expenseId}/reject`, { comment });
      await fetchExpense();
      setComment('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-12 text-center text-gray-400 text-sm">Loading...</div>
      </Layout>
    );
  }

  if (!expense) {
    return (
      <Layout>
        <div className="p-12 text-center text-gray-500 text-sm">Expense not found</div>
      </Layout>
    );
  }

  const categoryLabel = EXPENSE_CATEGORIES.find((c) => c.value === expense.category)?.label || expense.category;

  return (
    <Layout>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy mb-5 font-medium"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-navy">
            Expense detail
          </h1>
          <p className="mt-2 text-sm text-gray-600">{expense.description}</p>
        </div>
        <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold ${STATUS_COLORS[expense.status] || 'bg-gray-100 text-gray-700'}`}>
          {expense.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary card */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
              <InfoCell label="Amount" value={formatCurrency(expense.amount, expense.currency)} />
              {expense.converted_amount && (
                <InfoCell label="Converted" value={formatCurrency(expense.converted_amount, 'USD')} />
              )}
              <InfoCell label="Category" value={categoryLabel} />
              <InfoCell
                label="Date"
                value={new Date(expense.expense_date).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              />
            </div>
          </div>

          {/* Details card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-display text-sm font-bold uppercase text-navy mb-3">Details</h3>
            <dl className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div>
                <dt className="text-gray-500 text-xs">Submitted by</dt>
                <dd className="font-medium text-navy">{expense.submitted_by_name}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs">Email</dt>
                <dd className="font-medium text-navy">{expense.submitted_by_email}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs">Created</dt>
                <dd className="text-gray-700">{new Date(expense.created_at).toLocaleString()}</dd>
              </div>
              {expense.exchange_rate && (
                <div>
                  <dt className="text-gray-500 text-xs">Exchange rate</dt>
                  <dd className="text-gray-700">{expense.exchange_rate}</dd>
                </div>
              )}
              {expense.ocr_vendor_name && (
                <div>
                  <dt className="text-gray-500 text-xs">Vendor (OCR)</dt>
                  <dd className="text-gray-700">{expense.ocr_vendor_name}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Approval action card */}
          {canAct && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold uppercase text-navy mb-3">Your action</h3>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>
              )}

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Add a comment (required for rejection)"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  <Check size={16} /> Approve
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          )}

          {/* Audit trail */}
          {expense.approval_actions?.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold uppercase text-navy mb-3">Audit trail</h3>
              <div className="space-y-3">
                {expense.approval_actions.map((action) => (
                  <div key={action.id} className="flex items-start gap-3 text-sm">
                    <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${action.action === 'APPROVED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {action.action === 'APPROVED' ? <Check size={12} /> : <X size={12} />}
                    </div>
                    <div>
                      <p className="text-navy font-medium">
                        {action.actor_name} <span className="font-normal text-gray-500">{action.action.toLowerCase()}</span>
                      </p>
                      {action.comment && <p className="text-xs text-gray-500 mt-0.5">"{action.comment}"</p>}
                      <p className="text-[11px] text-gray-400 mt-0.5">{new Date(action.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Approval progress */}
        <div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-display text-sm font-bold uppercase text-navy mb-4">Approval progress</h3>

            {expense.approval_steps?.length === 0 ? (
              <p className="text-xs text-gray-400">No approval steps configured</p>
            ) : (
              <div className="space-y-0">
                {expense.approval_steps.map((step, i) => (
                  <div key={step.id} className="flex gap-3">
                    {/* Connector line + dot */}
                    <div className="flex flex-col items-center">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${STEP_COLOR[step.status]}`}>
                        {STEP_ICON[step.status]}
                      </div>
                      {i < expense.approval_steps.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 my-1" />
                      )}
                    </div>
                    <div className="pb-5">
                      <p className="text-sm font-medium text-navy">{step.step_label || `Step ${step.step_order + 1}`}</p>
                      <p className="text-xs text-gray-500">{step.approver_name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{step.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function InfoCell({ label, value }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-navy">{value}</p>
    </div>
  );
}
