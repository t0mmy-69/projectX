"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

interface Topic {
  id: string;
  keyword: string;
  category_filter?: string;
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

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/topics', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setTopics(data.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  const addTopic = async () => {
    if (!newKeyword.trim()) return;
    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ keyword: newKeyword.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setTopics(prev => [...prev, data.data]);
        setNewKeyword('');
        setShowModal(false);
      } else {
        setError(data.error || 'Failed to add topic');
      }
    } catch { setError('Network error'); }
    setAdding(false);
  };

  const toggleTopic = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/topics/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: !current }),
      });
      const data = await res.json();
      if (data.success) setTopics(prev => prev.map(t => t.id === id ? data.data : t));
    } catch {}
  };

  const deleteTopic = async (id: string) => {
    if (!confirm('Delete this topic?')) return;
    try {
      const res = await fetch(`/api/topics/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) setTopics(prev => prev.filter(t => t.id !== id));
    } catch {}
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Manage Topics</h2>
            <p className="text-sm text-muted">Control the keywords and narratives our engine monitors for you.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primary-light text-white text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(129,74,200,0.2)]"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Add New Topic
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0A0A0B] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
              <h3 className="text-lg font-bold">Add New Topic</h3>
              <p className="text-sm text-muted">Enter a keyword or phrase to monitor on X.</p>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <input
                type="text"
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTopic()}
                placeholder="e.g. AI Agents, Solana DeFi, SaaS Growth"
                autoFocus
                className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                {['AI Tech', 'Web3', 'Product Design', 'Crypto', 'Startups'].map(tag => (
                  <button key={tag} onClick={() => setNewKeyword(tag)}
                    className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowModal(false); setError(''); setNewKeyword(''); }}
                  className="flex-1 py-3 border border-white/5 rounded-xl text-sm font-bold hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={addTopic} disabled={adding || !newKeyword.trim()}
                  className="flex-1 py-3 bg-primary hover:bg-primary-light rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                  {adding ? 'Adding...' : 'Add Topic'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Topics Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <div key={topic.id} className="glass-panel p-6 rounded-2xl border border-white/5 group hover:border-primary/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <button onClick={() => toggleTopic(topic.id, topic.is_active)}
                    className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-colors cursor-pointer ${topic.is_active ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-white/5 text-muted hover:bg-white/10'}`}>
                    {topic.is_active ? 'Active' : 'Paused'}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => deleteTopic(topic.id)}
                      className="p-1 hover:bg-white/5 rounded text-muted hover:text-red-400 transition-colors">
                      <span className="material-symbols-outlined text-xs">delete</span>
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-1">{topic.keyword}</h3>
                <p className="text-[10px] text-muted uppercase font-bold tracking-wider mb-6">
                  {topic.is_active ? 'Monitoring 24/7' : 'Paused'}
                </p>
                <div className="border-t border-white/5 pt-4">
                  <div className="text-[10px] text-muted uppercase font-bold mb-1">Created</div>
                  <div className="text-sm font-medium">{new Date(topic.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            <div onClick={() => setShowModal(true)}
              className="p-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/[0.04] hover:border-primary/30 transition-all duration-300 min-h-[200px]">
              <span className="material-symbols-outlined text-4xl text-muted/30 mb-2">add_circle</span>
              <p className="text-xs font-bold text-muted">Add another narrative</p>
            </div>
          </div>
        )}

        {!loading && topics.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <span className="material-symbols-outlined text-6xl text-muted/20">topic</span>
            <p className="text-muted text-sm">No topics yet. Add your first topic to start monitoring.</p>
          </div>
        )}

        <div className="p-6 rounded-2xl border border-white/5 bg-[#0A0A0B] space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-xl">insights</span>
            <h3 className="text-sm font-bold uppercase tracking-wider">Scraper Status</h3>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Monitoring <strong className="text-white">{topics.filter(t => t.is_active).length}</strong> active topics.
            {topics.length === 0 ? ' Add topics above to start monitoring narratives on X.' : ' Engine running and checking for viral content.'}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
