"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

interface Rule {
  id: string;
  condition_type: string;
  condition_value: string;
  action_type: string;
  is_active: boolean;
  created_at: string;
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem('narrativeOS_auth');
  if (!stored) return {};
  try {
    const u = JSON.parse(stored);
    return { 'Authorization': `Bearer ${u.token}`, 'x-user-id': u.id, 'Content-Type': 'application/json' };
  } catch { return {}; }
}

const CONDITION_TYPES = ['viral_score', 'category_match', 'likes_threshold'];
const ACTION_TYPES = ['auto_reply', 'notify', 'suggest_cta', 'suggest_repost'];

export default function AutomationPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [masterEnabled, setMasterEnabled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ condition_type: 'viral_score', condition_value: '90', action_type: 'auto_reply' });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/automation', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setRules(data.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const addRule = async () => {
    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/automation', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setRules(prev => [...prev, data.data]);
        setShowModal(false);
        setForm({ condition_type: 'viral_score', condition_value: '90', action_type: 'auto_reply' });
      } else {
        setError(data.error || 'Failed to add rule');
      }
    } catch { setError('Network error'); }
    setAdding(false);
  };

  const toggleRule = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/automation/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: !current }),
      });
      const data = await res.json();
      if (data.success) setRules(prev => prev.map(r => r.id === id ? data.data : r));
    } catch {}
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    try {
      const res = await fetch(`/api/automation/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) setRules(prev => prev.filter(r => r.id !== id));
    } catch {}
  };

  const conditionLabel = (type: string, value: string) => {
    if (type === 'viral_score') return `Viral Score > ${value}`;
    if (type === 'category_match') return `Category is "${value}"`;
    if (type === 'likes_threshold') return `Likes > ${value}`;
    return `${type}: ${value}`;
  };

  const actionLabel = (type: string) => {
    const map: Record<string, string> = {
      auto_reply: 'Auto Reply with AI Persona',
      notify: 'Send Notification',
      suggest_cta: 'Suggest CTA',
      suggest_repost: 'Suggest Repost',
    };
    return map[type] || type;
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-8">
        {/* Master Toggle */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Auto Reply Mode</h2>
            <p className="text-sm text-muted">Automatically respond to viral posts based on your rules.</p>
          </div>
          <button
            onClick={() => setMasterEnabled(!masterEnabled)}
            className={`w-14 h-7 rounded-full relative transition-all duration-300 ${masterEnabled ? 'bg-primary shadow-[0_0_15px_rgba(129,74,200,0.3)]' : 'bg-white/10'}`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${masterEnabled ? 'right-1' : 'left-1'}`} />
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0A0A0B] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5">
              <h3 className="text-lg font-bold">Add Automation Rule</h3>
              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">IF Condition</label>
                <select value={form.condition_type} onChange={e => setForm(f => ({ ...f, condition_type: e.target.value }))}
                  className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50">
                  {CONDITION_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">
                  {form.condition_type === 'category_match' ? 'Category Name' : 'Threshold Value'}
                </label>
                <input type="text" value={form.condition_value}
                  onChange={e => setForm(f => ({ ...f, condition_value: e.target.value }))}
                  placeholder={form.condition_type === 'category_match' ? 'e.g. breaking_news' : 'e.g. 90'}
                  className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">THEN Action</label>
                <select value={form.action_type} onChange={e => setForm(f => ({ ...f, action_type: e.target.value }))}
                  className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50">
                  {ACTION_TYPES.map(t => <option key={t} value={t}>{actionLabel(t)}</option>)}
                </select>
              </div>

              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-muted">
                <span className="text-primary font-bold">Preview: </span>
                IF {conditionLabel(form.condition_type, form.condition_value)} → {actionLabel(form.action_type)}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowModal(false); setError(''); }}
                  className="flex-1 py-3 border border-white/5 rounded-xl text-sm font-bold hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={addRule} disabled={adding}
                  className="flex-1 py-3 bg-primary hover:bg-primary-light rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                  {adding ? 'Saving...' : 'Save Rule'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rule Builder */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Active Rules</h3>
            <button onClick={() => setShowModal(true)}
              className="px-3 py-1.5 bg-white/[0.03] border border-white/5 text-xs font-bold rounded-xl hover:bg-white/[0.06] hover:border-primary/30 transition-all duration-300">
              + Add Rule
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-16 space-y-3 border border-dashed border-white/10 rounded-2xl">
              <span className="material-symbols-outlined text-5xl text-muted/20">smart_toy</span>
              <p className="text-muted text-sm">No automation rules yet.</p>
              <button onClick={() => setShowModal(true)} className="text-primary text-sm font-bold hover:text-primary-light">+ Add your first rule</button>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map(rule => (
                <div key={rule.id} className={`p-5 rounded-xl border transition-all duration-300 ${rule.is_active ? 'bg-[#0A0A0B] border-white/5 hover:border-primary/30' : 'bg-black/20 border-white/[0.03] opacity-60'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${rule.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                      <span className="text-xs font-bold text-gray-300">{rule.is_active ? 'Active' : 'Paused'}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleRule(rule.id, rule.is_active)}
                        className="p-1.5 hover:bg-white/5 rounded text-muted hover:text-white transition-colors" title="Toggle">
                        <span className="material-symbols-outlined text-sm">{rule.is_active ? 'pause' : 'play_arrow'}</span>
                      </button>
                      <button onClick={() => deleteRule(rule.id)}
                        className="p-1.5 hover:bg-white/5 rounded text-muted hover:text-red-400 transition-colors">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-mono text-primary">IF {conditionLabel(rule.condition_type, rule.condition_value)}</p>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span className="material-symbols-outlined text-sm">subdirectory_arrow_right</span>
                      THEN {actionLabel(rule.action_type)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anti-Ban Safety */}
        <section className="p-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 space-y-4">
          <div className="flex items-center gap-2 text-orange-400">
            <span className="material-symbols-outlined">security</span>
            <h3 className="text-sm font-black uppercase tracking-wider">Anti-Ban Safety</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><div className="text-[10px] text-orange-400/60 uppercase font-black tracking-wider">Max Replies / Hour</div><div className="text-sm font-bold text-orange-400/90">10</div></div>
            <div><div className="text-[10px] text-orange-400/60 uppercase font-black tracking-wider">Cooldown (Min)</div><div className="text-sm font-bold text-orange-400/90">5</div></div>
            <div><div className="text-[10px] text-orange-400/60 uppercase font-black tracking-wider">Manual Confirm</div><div className="text-sm font-bold text-orange-400/90">Enabled</div></div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
