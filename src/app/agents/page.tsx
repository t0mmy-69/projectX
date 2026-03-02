"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ToastProvider';
import { getAuthHeaders } from '@/lib/authHeaders';

type LLMProvider = 'claude' | 'openai' | 'grok' | 'gemini' | 'deepseek';
type AgentTone   = 'professional' | 'casual' | 'witty' | 'provocative' | 'educational';

interface Agent {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  tone: AgentTone;
  topics: string[];
  reply_style: string;
  llm_provider: LLMProvider;
  llm_model: string;
  auto_mode: boolean;
  max_replies_hour: number;
  min_viral_score: number;
  is_active: boolean;
  created_at: string;
}

interface AgentDecision {
  id: string;
  agent_id: string;
  post_text: string;
  post_author: string;
  reply_text: string;
  tokens_used: number;
  llm_provider: string;
  was_auto_posted: boolean;
  created_at: string;
}

const PROVIDER_INFO: Record<LLMProvider, { label: string; icon: string; models: string[]; color: string }> = {
  claude:   { label: 'Claude',   icon: '🧠', models: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'], color: '#e07940' },
  openai:   { label: 'GPT',      icon: '✨', models: ['gpt-4o-mini', 'gpt-4o', 'o1-mini'], color: '#10a37f' },
  grok:     { label: 'Grok',     icon: '⚡', models: ['grok-3-mini', 'grok-3', 'grok-2-1212'], color: '#1d9bf0' },
  gemini:   { label: 'Gemini',   icon: '💎', models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'], color: '#4285f4' },
  deepseek: { label: 'DeepSeek', icon: '🔍', models: ['deepseek-chat', 'deepseek-reasoner'], color: '#7c3aed' },
};

const TONE_OPTIONS: { value: AgentTone; label: string; desc: string }[] = [
  { value: 'professional', label: '🧑‍💼 Professional', desc: 'Sharp, authoritative insights' },
  { value: 'casual',       label: '😎 Casual',       desc: 'Relatable, informal tone' },
  { value: 'witty',        label: '🎯 Witty',         desc: 'Clever, humorous takes' },
  { value: 'provocative',  label: '🔥 Provocative',   desc: 'Bold, contrarian opinions' },
  { value: 'educational',  label: '📚 Educational',   desc: 'Informative, add context' },
];

const EMPTY_FORM = {
  name: '',
  description: '',
  prompt: '',
  tone: 'professional' as AgentTone,
  topics: [] as string[],
  topicInput: '',
  reply_style: 'Concise and insightful. 1-2 sentences max.',
  llm_provider: 'claude' as LLMProvider,
  llm_model: 'claude-3-5-haiku-20241022',
  auto_mode: false,
  max_replies_hour: 10,
  min_viral_score: 0,
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'agents' | 'activity'>('agents');
  const { showToast } = useToast();

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setAgents(data.data);
    } catch {}
    setLoading(false);
  }, []);

  const fetchDecisions = useCallback(async () => {
    try {
      const res = await fetch('/api/agent/decisions?limit=30', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setDecisions(data.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchAgents();
    fetchDecisions();
  }, [fetchAgents, fetchDecisions]);

  const openCreate = () => {
    setEditAgent(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (agent: Agent) => {
    setEditAgent(agent);
    setForm({
      name: agent.name,
      description: agent.description || '',
      prompt: agent.prompt,
      tone: agent.tone,
      topics: [...agent.topics],
      topicInput: '',
      reply_style: agent.reply_style,
      llm_provider: agent.llm_provider,
      llm_model: agent.llm_model,
      auto_mode: agent.auto_mode,
      max_replies_hour: agent.max_replies_hour,
      min_viral_score: agent.min_viral_score,
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditAgent(null); };

  const addTopic = () => {
    const t = form.topicInput.trim();
    if (t && !form.topics.includes(t)) {
      setForm(f => ({ ...f, topics: [...f.topics, t], topicInput: '' }));
    }
  };

  const removeTopic = (t: string) => setForm(f => ({ ...f, topics: f.topics.filter(x => x !== t) }));

  const handleProviderChange = (p: LLMProvider) => {
    setForm(f => ({ ...f, llm_provider: p, llm_model: PROVIDER_INFO[p].models[0] }));
  };

  const saveAgent = async () => {
    if (!form.name.trim())   { showToast('Agent name is required', 'error'); return; }
    if (!form.prompt.trim()) { showToast('System prompt is required', 'error'); return; }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        prompt: form.prompt,
        tone: form.tone,
        topics: form.topics,
        reply_style: form.reply_style,
        llm_provider: form.llm_provider,
        llm_model: form.llm_model,
        auto_mode: form.auto_mode,
        max_replies_hour: form.max_replies_hour,
        min_viral_score: form.min_viral_score,
      };

      const url    = editAgent ? `/api/agents/${editAgent.id}` : '/api/agents';
      const method = editAgent ? 'PATCH' : 'POST';

      const res  = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();

      if (data.success) {
        await fetchAgents();
        closeForm();
        showToast(editAgent ? 'Agent updated!' : 'Agent created!', 'success');
      } else {
        showToast(data.error || 'Failed to save agent', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    setSaving(false);
  };

  const toggleAgent = async (agent: Agent) => {
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'PATCH', headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: !agent.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        setAgents(prev => prev.map(a => a.id === agent.id ? data.data : a));
        showToast(`Agent ${data.data.is_active ? 'activated' : 'paused'}`, 'info');
      }
    } catch {}
  };

  const deleteAgent = async (id: string) => {
    if (!confirm('Delete this agent?')) return;
    try {
      const res = await fetch(`/api/agents/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        setAgents(prev => prev.filter(a => a.id !== id));
        showToast('Agent deleted', 'info');
      }
    } catch {}
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">AI Agents</h2>
            <p className="text-sm text-muted">Build autonomous agents that reply to X posts using your LLM.</p>
          </div>
          <button onClick={openCreate}
            className="px-4 py-2.5 bg-primary hover:bg-primary-light text-white text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(129,74,200,0.2)]">
            <span className="material-symbols-outlined text-sm">add_circle</span>
            New Agent
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 gap-8">
          {(['agents', 'activity'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-bold transition-all relative capitalize ${activeTab === tab ? 'text-white' : 'text-muted hover:text-white'}`}>
              {tab === 'agents' ? `Agents (${agents.length})` : `Activity (${decisions.length})`}
              {activeTab === tab && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(129,74,200,0.5)]" />}
            </button>
          ))}
        </div>

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-primary text-3xl">android</span>
                </div>
                <h3 className="text-lg font-bold">No agents yet</h3>
                <p className="text-sm text-muted max-w-sm mx-auto">Create your first agent to start auto-replying to relevant posts on X.</p>
                <button onClick={openCreate} className="text-primary text-sm font-bold hover:text-primary-light">Create First Agent</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {agents.map(agent => (
                  <AgentCard key={agent.id} agent={agent} onEdit={openEdit} onToggle={toggleAgent} onDelete={deleteAgent} />
                ))}
                <div onClick={openCreate}
                  className="p-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/[0.04] hover:border-primary/30 transition-all duration-300 min-h-[220px]">
                  <span className="material-symbols-outlined text-4xl text-muted/30 mb-2">add_circle</span>
                  <p className="text-xs font-bold text-muted">Add new agent</p>
                </div>
              </div>
            )}

            {/* Quick start guide */}
            {agents.length > 0 && (
              <div className="p-6 rounded-2xl border border-primary/10 bg-primary/[0.03] space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-xl">extension</span>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Extension Auto-Reply</h3>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Open the NarrativeOS Chrome Extension on X, select an agent, and turn on Auto-Reply.
                  The extension will scan your feed and reply to matching posts using your agent.
                </p>
                <div className="flex gap-3 mt-2">
                  <div className="text-xs text-muted flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-black">1</span>
                    Add API key in Settings
                  </div>
                  <div className="text-xs text-muted flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-black">2</span>
                    Install Extension
                  </div>
                  <div className="text-xs text-muted flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-black">3</span>
                    Select agent → Enable
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            {decisions.length === 0 ? (
              <div className="text-center py-16 text-muted text-sm">
                No activity yet. Enable an agent in the extension to start generating replies.
              </div>
            ) : (
              decisions.map(d => (
                <div key={d.id} className="glass-panel p-5 rounded-2xl border border-white/5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${d.was_auto_posted ? 'bg-green-500/10 text-green-400' : 'bg-primary/10 text-primary'}`}>
                        {d.was_auto_posted ? 'Auto-posted' : 'Preview'}
                      </span>
                      <span className="text-[9px] text-muted uppercase font-bold">{d.llm_provider} · {d.tokens_used} tokens</span>
                    </div>
                    <span className="text-[10px] text-muted">{new Date(d.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted mb-2 line-clamp-2">
                    <span className="font-bold text-white/40">@{d.post_author}:</span> {d.post_text}
                  </p>
                  <div className="border-t border-white/5 pt-3">
                    <p className="text-sm">{d.reply_text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Agent Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A0A0B] border border-white/10 rounded-2xl w-full max-w-2xl my-8 overflow-hidden">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h3 className="text-lg font-bold">{editAgent ? 'Edit Agent' : 'Create New Agent'}</h3>
              <button onClick={closeForm} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-muted hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-6">

              {/* Name + Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Agent Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Thought Leader, Crypto Degen"
                    className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Description</label>
                  <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What does this agent do?"
                    className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm" />
                </div>
              </div>

              {/* System Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">System Prompt / Persona *</label>
                <textarea value={form.prompt} onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
                  rows={4} placeholder="Describe your agent's personality, expertise, and background. E.g. 'You are a seasoned AI researcher with 10 years experience building LLMs...'"
                  className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm resize-none" />
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Reply Tone</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {TONE_OPTIONS.map(t => (
                    <button key={t.value} onClick={() => setForm(f => ({ ...f, tone: t.value }))}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${form.tone === t.value ? 'border-primary/50 bg-primary/10 text-primary' : 'border-white/5 hover:border-white/10 text-muted hover:text-white'}`}>
                      <div className="font-bold mb-0.5">{t.label}</div>
                      <div className="text-[10px] opacity-70">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply Style */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Reply Style</label>
                <input type="text" value={form.reply_style} onChange={e => setForm(f => ({ ...f, reply_style: e.target.value }))}
                  placeholder="e.g. Short punchy replies. 1-2 sentences. No hashtags."
                  className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm" />
              </div>

              {/* Topics */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Topic Keywords</label>
                <div className="flex gap-2">
                  <input type="text" value={form.topicInput}
                    onChange={e => setForm(f => ({ ...f, topicInput: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                    placeholder="e.g. AI, startup, DeFi"
                    className="flex-1 bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm" />
                  <button onClick={addTopic} className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-bold hover:bg-primary/20">Add</button>
                </div>
                {form.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.topics.map(t => (
                      <span key={t} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                        {t}
                        <button onClick={() => removeTopic(t)} className="hover:text-red-400 transition-colors leading-none">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted">Posts containing these words will trigger this agent.</p>
              </div>

              {/* LLM Provider + Model */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">LLM Provider</label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(PROVIDER_INFO) as LLMProvider[]).map(p => (
                    <button key={p} onClick={() => handleProviderChange(p)}
                      className={`p-3 rounded-xl border text-center text-xs transition-all ${form.llm_provider === p ? 'border-primary/50 bg-primary/10' : 'border-white/5 hover:border-white/10'}`}>
                      <div className="text-lg mb-1">{PROVIDER_INFO[p].icon}</div>
                      <div className={`text-[10px] font-bold ${form.llm_provider === p ? 'text-primary' : 'text-muted'}`}>{PROVIDER_INFO[p].label}</div>
                    </button>
                  ))}
                </div>
                <select value={form.llm_model} onChange={e => setForm(f => ({ ...f, llm_model: e.target.value }))}
                  className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm">
                  {PROVIDER_INFO[form.llm_provider].models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <p className="text-[10px] text-muted">
                  Add your API key in <span className="text-primary">Settings → API Keys</span> to activate AI replies.
                </p>
              </div>

              {/* Settings Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Max replies/hour</label>
                  <input type="number" min="1" max="60" value={form.max_replies_hour}
                    onChange={e => setForm(f => ({ ...f, max_replies_hour: parseInt(e.target.value) || 10 }))}
                    className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Min viral score</label>
                  <input type="number" min="0" value={form.min_viral_score}
                    onChange={e => setForm(f => ({ ...f, min_viral_score: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Auto-post mode</label>
                  <div className="flex items-center gap-3 h-[46px] px-4 bg-black border border-white/5 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className={`relative w-10 h-5 rounded-full transition-colors ${form.auto_mode ? 'bg-primary' : 'bg-white/10'}`}
                        onClick={() => setForm(f => ({ ...f, auto_mode: !f.auto_mode }))}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.auto_mode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                      <span className="text-xs text-muted">{form.auto_mode ? 'Auto-post' : 'Preview first'}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-white/5">
              <button onClick={closeForm} className="flex-1 py-3 border border-white/5 rounded-xl text-sm font-bold hover:bg-white/5 transition-colors text-muted">Cancel</button>
              <button onClick={saveAgent} disabled={saving}
                className="flex-1 py-3 bg-primary hover:bg-primary-light rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : (editAgent ? 'Update Agent' : 'Create Agent')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ─── Agent Card Component ────────────────────────────────────────────────────

function AgentCard({ agent, onEdit, onToggle, onDelete }: {
  agent: Agent;
  onEdit: (a: Agent) => void;
  onToggle: (a: Agent) => void;
  onDelete: (id: string) => void;
}) {
  const provider = PROVIDER_INFO[agent.llm_provider];

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/5 group hover:border-primary/30 transition-all duration-300 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <button onClick={() => onToggle(agent)}
          className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-colors cursor-pointer ${agent.is_active ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-white/5 text-muted hover:bg-white/10'}`}>
          {agent.is_active ? '● Active' : '○ Paused'}
        </button>
        <div className="flex gap-1">
          <button onClick={() => onEdit(agent)} className="p-1 hover:bg-white/5 rounded text-muted hover:text-white transition-colors">
            <span className="material-symbols-outlined text-xs">edit</span>
          </button>
          <button onClick={() => onDelete(agent.id)} className="p-1 hover:bg-white/5 rounded text-muted hover:text-red-400 transition-colors">
            <span className="material-symbols-outlined text-xs">delete</span>
          </button>
        </div>
      </div>

      <h3 className="text-lg font-bold mb-1">{agent.name}</h3>
      {agent.description && <p className="text-xs text-muted mb-3">{agent.description}</p>}

      <div className="flex flex-wrap gap-1.5 mb-4">
        {agent.topics.slice(0, 5).map(t => (
          <span key={t} className="px-2 py-0.5 rounded-md bg-white/5 text-muted text-[10px] font-bold">{t}</span>
        ))}
        {agent.topics.length > 5 && <span className="px-2 py-0.5 rounded-md bg-white/5 text-muted text-[10px] font-bold">+{agent.topics.length - 5}</span>}
      </div>

      <div className="mt-auto border-t border-white/5 pt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[9px] text-muted uppercase font-black mb-0.5">LLM</div>
          <div className="text-xs font-bold flex items-center gap-1">
            <span>{provider.icon}</span> {provider.label}
          </div>
        </div>
        <div>
          <div className="text-[9px] text-muted uppercase font-black mb-0.5">Mode</div>
          <div className="text-xs font-bold">{agent.auto_mode ? '⚡ Auto-post' : '👁 Preview'}</div>
        </div>
        <div>
          <div className="text-[9px] text-muted uppercase font-black mb-0.5">Tone</div>
          <div className="text-xs font-bold capitalize">{agent.tone}</div>
        </div>
        <div>
          <div className="text-[9px] text-muted uppercase font-black mb-0.5">Limit</div>
          <div className="text-xs font-bold">{agent.max_replies_hour}/hr</div>
        </div>
      </div>
    </div>
  );
}
