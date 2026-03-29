import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import client from '../../api/client';
import { Shield, Plus, X, Star, Trash2, GripVertical } from 'lucide-react';

export default function ApprovalRules() {
  const [rules, setRules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editRule, setEditRule] = useState(null);

  const fetchData = async () => {
    try {
      const [rulesRes, usersRes] = await Promise.all([
        client.get('/approval-rules'),
        client.get('/users'),
      ]);
      setRules(rulesRes.data);
      setUsers(usersRes.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSetDefault = async (ruleId) => {
    await client.patch(`/approval-rules/${ruleId}/default`);
    fetchData();
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm('Deactivate this rule?')) return;
    await client.delete(`/approval-rules/${ruleId}`);
    fetchData();
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-navy">
            Approval rules
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Configure how expenses get approved in your company
          </p>
        </div>
        <button
          onClick={() => { setEditRule(null); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-400 hover:bg-primary-500 text-navy font-semibold rounded-lg transition-colors text-sm"
        >
          <Plus size={18} />
          New rule
        </button>
      </div>

      {(showCreate || editRule) && (
        <RuleForm
          rule={editRule}
          users={users}
          onClose={() => { setShowCreate(false); setEditRule(null); }}
          onSaved={() => { setShowCreate(false); setEditRule(null); fetchData(); }}
        />
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm text-center text-gray-400 text-sm">
            Loading...
          </div>
        ) : rules.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm text-center">
            <Shield className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="text-sm text-gray-500">No approval rules yet</p>
            <p className="text-xs text-gray-400 mt-1">Create a rule to define your approval workflow</p>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-navy">{rule.name}</h3>
                  {rule.is_default && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-md">
                      <Star size={10} /> Default
                    </span>
                  )}
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    {rule.rule_type.replace('_', ' ')}
                  </span>
                  {rule.percent_required && (
                    <span className="text-xs text-gray-500">
                      {Math.round(rule.percent_required * 100)}% threshold
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!rule.is_default && (
                    <button
                      onClick={() => handleSetDefault(rule.id)}
                      className="text-xs text-gray-500 hover:text-navy font-medium px-2 py-1"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    onClick={() => { setEditRule(rule); setShowCreate(false); }}
                    className="text-xs text-gray-500 hover:text-navy font-medium px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Steps */}
              <div className="px-6 py-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Approval steps ({rule.steps.length})
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {rule.steps.map((step, i) => {
                    const approver = users.find((u) => u.id === step.approver_id);
                    return (
                      <div key={step.id} className="flex items-center gap-2">
                        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy text-white text-[10px] font-bold">
                            {step.step_order}
                          </span>
                          <div>
                            <p className="text-xs font-medium text-navy">
                              {step.step_label || `Step ${step.step_order}`}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {approver ? `${approver.first_name} ${approver.last_name}` : step.approver_id}
                            </p>
                          </div>
                        </div>
                        {i < rule.steps.length - 1 && (
                          <span className="text-gray-300 text-xs">→</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}

function RuleForm({ rule, users, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: rule?.name || '',
    rule_type: rule?.rule_type || 'PERCENTAGE',
    percent_required: rule?.percent_required ? Math.round(rule.percent_required * 100) : 60,
    specific_user_id: rule?.specific_user_id || '',
  });
  const [steps, setSteps] = useState(
    rule?.steps?.map((s) => ({ approver_id: s.approver_id, step_label: s.step_label || '' })) || [
      { approver_id: '', step_label: '' },
    ]
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addStep = () => {
    setSteps((prev) => [...prev, { approver_id: '', step_label: '' }]);
  };

  const removeStep = (idx) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateStep = (idx, field, value) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validSteps = steps.filter((s) => s.approver_id);
    if (validSteps.length === 0) {
      setError('Add at least one approval step');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        rule_type: form.rule_type,
        percent_required: form.rule_type !== 'SPECIFIC_USER' ? form.percent_required / 100 : null,
        specific_user_id: form.rule_type !== 'PERCENTAGE' ? form.specific_user_id || null : null,
        steps: validSteps,
      };

      if (rule) {
        await client.put(`/approval-rules/${rule.id}`, payload);
      } else {
        payload.is_default = false;
        await client.post('/approval-rules', payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save rule');
    } finally {
      setLoading(false);
    }
  };

  const eligibleApprovers = users.filter((u) => u.role === 'MANAGER' || u.role === 'ADMIN');

  return (
    <div className="rounded-xl border border-primary-200 bg-white shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-bold uppercase text-navy">
          {rule ? 'Edit rule' : 'New approval rule'}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name + Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rule name</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              placeholder="e.g. Standard Approval"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rule type</label>
            <select
              name="rule_type"
              value={form.rule_type}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white text-sm"
            >
              <option value="PERCENTAGE">Percentage threshold</option>
              <option value="SPECIFIC_USER">Specific user auto-approve</option>
              <option value="HYBRID">Hybrid (percentage + specific user)</option>
            </select>
          </div>
        </div>

        {/* Conditional fields */}
        <div className="grid grid-cols-2 gap-4">
          {form.rule_type !== 'SPECIFIC_USER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Approval threshold: {form.percent_required}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={form.percent_required}
                onChange={(e) => setForm((prev) => ({ ...prev, percent_required: parseInt(e.target.value) }))}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>10%</span>
                <span>100%</span>
              </div>
            </div>
          )}
          {form.rule_type !== 'PERCENTAGE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Auto-approve user</label>
              <select
                name="specific_user_id"
                value={form.specific_user_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white text-sm"
              >
                <option value="">Select user</option>
                {eligibleApprovers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Steps */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Approval steps (in order)</label>
            <button
              type="button"
              onClick={addStep}
              className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              <Plus size={14} /> Add step
            </button>
          </div>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <GripVertical size={14} className="text-gray-400 shrink-0" />
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy text-white text-[10px] font-bold shrink-0">
                  {i + 1}
                </span>
                <select
                  value={step.approver_id}
                  onChange={(e) => updateStep(i, 'approver_id', e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value="">Select approver</option>
                  {eligibleApprovers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.role})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={step.step_label}
                  onChange={(e) => updateStep(i, 'step_label', e.target.value)}
                  placeholder="Label (e.g. Finance)"
                  className="w-36 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(i)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary-400 hover:bg-primary-500 text-navy font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            {loading ? 'Saving...' : rule ? 'Update rule' : 'Create rule'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
