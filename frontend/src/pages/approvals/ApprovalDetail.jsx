import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { ArrowLeft, Check, X, Paperclip } from 'lucide-react';

export default function ApprovalDetail() {
  const { expenseId } = useParams();
  const { user, company } = useAuth();
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

  useEffect(() => { fetchExpense(); }, [expenseId]);

  const isOwner = expense?.submitted_by_id === user?.id;
  const canAct = expense && user && (user.role === 'ADMIN' || user.role === 'MANAGER') &&
    expense.approval_steps?.some((s) => s.approver_id === user.id && s.status === 'AWAITING');
  const isReadonly = expense && expense.status !== 'DRAFT';

  const handleApprove = async () => {
    setActionLoading(true); setError('');
    try {
      await client.post(`/approvals/${expenseId}/approve`, { comment: comment || null });
      await fetchExpense(); setComment('');
    } catch (err) { setError(err.response?.data?.detail || 'Approval failed'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!comment.trim()) { setError('Comment is required when rejecting'); return; }
    setActionLoading(true); setError('');
    try {
      await client.post(`/approvals/${expenseId}/reject`, { comment });
      await fetchExpense(); setComment('');
    } catch (err) { setError(err.response?.data?.detail || 'Rejection failed'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <Layout><div className="p-12 text-center text-gray-400 text-sm">Loading...</div></Layout>;
  if (!expense) return <Layout><div className="p-12 text-center text-gray-500 text-sm">Expense not found</div></Layout>;

  const catLabel = EXPENSE_CATEGORIES.find((c) => c.value === expense.category)?.label || expense.category;
  const companyCurrency = company?.default_currency || 'USD';
  const showConverted = expense.converted_amount && expense.currency !== companyCurrency;

  return (
    <Layout>
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy mb-4 font-medium">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header with status bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-navy">
          Expense detail
        </h1>
        <StatusBar current={expense.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Receipt attachment */}
          {expense.receipt_url && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm">
              <Paperclip size={16} className="text-gray-400" />
              <a
                href={`${(import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')}${expense.receipt_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy font-medium hover:underline"
              >
                View attached receipt
              </a>
            </div>
          )}

          {/* Expense form fields — READONLY */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="grid grid-cols-2 gap-5">
              <Field label="Description" value={expense.description} />
              <Field label="Expense date" value={new Date(expense.expense_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <Field label="Category" value={catLabel} />
              <Field label="Paid by" value={expense.paid_by === 'COMPANY' ? 'Company card' : 'Employee (personal)'} />
              <div>
                <p className="text-xs text-gray-500 mb-1">Total amount</p>
                <p className="text-lg font-bold text-navy">
                  {formatCurrency(expense.amount, expense.currency)}
                </p>
                {showConverted && (
                  <p className="text-xs text-amber-600 mt-1">
                    ≈ {formatCurrency(expense.converted_amount, companyCurrency)}
                    <span className="text-gray-400 ml-1">(rate: {expense.exchange_rate})</span>
                  </p>
                )}
              </div>
              <Field label="Currency" value={expense.currency} />
            </div>

            {expense.remarks && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Remarks</p>
                <p className="text-sm text-gray-700">{expense.remarks}</p>
              </div>
            )}

            {/* Submitted by + timestamp */}
            <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 gap-5">
              <Field label="Submitted by" value={`${expense.submitted_by_name} (${expense.submitted_by_email})`} />
              <Field label="Submitted at" value={new Date(expense.created_at).toLocaleString()} />
            </div>

            {isReadonly && isOwner && (
              <div className="mt-5 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500">
                This expense has been submitted and is read-only. Check the approval log below for status updates.
              </div>
            )}
          </div>

          {/* Manager conversion note */}
          {!isOwner && showConverted && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <strong>Currency conversion:</strong> Original amount is {formatCurrency(expense.amount, expense.currency)}.
              Auto-converted to <strong>{formatCurrency(expense.converted_amount, companyCurrency)}</strong> using
              today's exchange rate ({expense.exchange_rate}).
            </div>
          )}

          {/* Approve/Reject actions */}
          {canAct && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold uppercase text-navy mb-3">Your action</h3>
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
                placeholder="Add a comment (required for rejection)"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm resize-none mb-4" />
              <div className="flex gap-3">
                <button onClick={handleApprove} disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg text-sm disabled:opacity-50">
                  <Check size={16} /> Approve
                </button>
                <button onClick={handleReject} disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm disabled:opacity-50">
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          )}

          {/* Approval log table (from wireframe) */}
          {expense.approval_actions?.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-display text-sm font-bold uppercase text-navy">Approval log</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500">
                    <th className="text-left px-6 py-3 font-semibold uppercase tracking-wider">Approver</th>
                    <th className="text-left px-6 py-3 font-semibold uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 font-semibold uppercase tracking-wider">Time</th>
                    <th className="text-left px-6 py-3 font-semibold uppercase tracking-wider">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {expense.approval_actions.map((action) => (
                    <tr key={action.id} className="border-b border-gray-50">
                      <td className="px-6 py-3 font-medium text-navy">{action.actor_name}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                          action.action.includes('APPROVED')
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {action.action.replace('OVERRIDE_', '')}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {new Date(action.created_at).toLocaleString('en-US', {
                          hour: '2-digit', minute: '2-digit',
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-3 text-gray-500 italic">{action.comment || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar: Approval progress */}
        <div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-display text-sm font-bold uppercase text-navy mb-4">Approval progress</h3>
            {expense.approval_steps?.length === 0 ? (
              <p className="text-xs text-gray-400">No approval steps configured</p>
            ) : (
              <div className="space-y-0">
                {expense.approval_steps.map((step, i) => (
                  <div key={step.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${STEP_COLOR[step.status]}`}>
                        {STEP_ICON[step.status]}
                      </div>
                      {i < expense.approval_steps.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
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

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-navy">{value}</p>
    </div>
  );
}

function StatusBar({ current }) {
  const flow = [
    { key: 'DRAFT', label: 'Draft' },
    { key: 'PENDING', label: 'Waiting approval', also: ['IN_PROGRESS'] },
    { key: 'APPROVED', label: 'Approved' },
  ];

  let activeIdx = flow.findIndex((s) => s.key === current || s.also?.includes(current));
  const isRejected = current === 'REJECTED';
  if (activeIdx === -1) activeIdx = 0;

  return (
    <div className="flex items-center gap-1">
      {isRejected ? (
        <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-700">Rejected</span>
      ) : (
        flow.map((step, i) => (
          <div key={step.key} className="flex items-center gap-1">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              i < activeIdx ? 'bg-green-100 text-green-700'
                : i === activeIdx ? 'bg-navy text-white'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {step.label}
            </span>
            {i < flow.length - 1 && <span className="text-gray-300 text-xs">›</span>}
          </div>
        ))
      )}
    </div>
  );
}

const STEP_ICON = {
  APPROVED: <Check size={14} />,
  REJECTED: <X size={14} />,
  AWAITING: <span className="h-2 w-2 rounded-full bg-white" />,
  PENDING: <span className="h-2 w-2 rounded-full bg-gray-400" />,
  SKIPPED: <span className="text-[10px]">—</span>,
};

const STEP_COLOR = {
  APPROVED: 'bg-green-500 text-white',
  REJECTED: 'bg-red-500 text-white',
  AWAITING: 'bg-primary-400 text-navy',
  PENDING: 'bg-gray-200 text-gray-500',
  SKIPPED: 'bg-gray-300 text-gray-600',
};
