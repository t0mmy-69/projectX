"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import EmptyState from '@/components/EmptyState';
import { getAuthHeaders } from '@/lib/authHeaders';

export default function DraftStudioPage() {
  const [draft, setDraft] = useState('');
  const [hooks, setHooks] = useState<string[]>([]);
  const [topics, setTopics] = useState<{id: string; keyword: string}[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [tone, setTone] = useState(50);
  const [error, setError] = useState('');

  const toneLabel = tone < 33 ? 'Professional' : tone < 66 ? 'Balanced' : 'Provocative';

  // Load topics
  useEffect(() => {
    fetch('/api/topics', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setTopics(data.data);
          if (data.data.length > 0) setSelectedTopic(data.data[0].id);
        }
      }).catch(() => {});
  }, []);

  const generate = useCallback(async () => {
    if (!selectedTopic) { setError('Please add a topic first in the Topics page.'); return; }
    setGenerating(true);
    setError('');
    try {
      // Map tone slider to content category
      const category = tone < 33 ? 'data_research' : tone < 66 ? 'narrative_shift' : 'opinion';
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          topic_id: selectedTopic,
          category,
          summary: '',
          historical_tweets: [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        const d = data.data;
        setDraft(d.tweet_draft || '');
        setHooks([d.hook_variation_1, d.hook_variation_2, d.hook_variation_3].filter(Boolean));
      } else {
        setError(data.error || 'Failed to generate draft');
      }
    } catch { setError('Network error'); }
    setGenerating(false);
  }, [selectedTopic, tone]);

  const copyDraft = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendToExtension = () => {
    setSent(true);
    setTimeout(() => setSent(false), 2000);
    // Signal to extension via storage
    if (typeof window !== 'undefined') {
      localStorage.setItem('narrativeOS_pending_draft', draft);
    }
  };

  const charCount = draft.length;
  const charColor = charCount > 260 ? 'text-red-400' : charCount > 220 ? 'text-yellow-400' : 'text-muted';

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" style={{ minHeight: 'calc(100vh - 160px)' }}>
        {/* Left: Editor */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {topics.length === 0 && (
            <EmptyState
              icon="edit_note"
              title="Draft studio needs a topic"
              description="Create at least one topic to generate persona-based drafts."
              action={<a href="/topics" className="text-primary text-sm font-bold hover:text-primary-light">Go to Topics</a>}
            />
          )}
          {/* Topic Selector */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-muted uppercase tracking-wider flex-shrink-0">Topic:</label>
            {topics.length > 0 ? (
              <select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}
                aria-label="Select topic"
                className="bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50 flex-1">
                {topics.map(t => <option key={t.id} value={t.id}>{t.keyword}</option>)}
              </select>
            ) : (
              <span className="text-sm text-muted">No topics yet — <a href="/topics" className="text-primary hover:text-primary-light">add one first</a></span>
            )}
            <button onClick={generate} disabled={generating || !selectedTopic}
              className="px-4 py-2 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 flex-shrink-0">
              <span className="material-symbols-outlined text-sm">{generating ? 'sync' : 'auto_awesome'}</span>
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex-1 glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col" style={{ minHeight: '400px' }}>
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
              <span className="text-sm font-bold">Post Draft</span>
              <div className="flex items-center gap-2 text-[10px] font-bold">
                <span className={charColor}>{charCount}/280</span>
                <div className="w-[1px] h-3 bg-white/5" />
                <span className="text-muted">Persona: {toneLabel}</span>
              </div>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Draft editor"
              className="flex-1 bg-transparent p-6 text-base outline-none resize-none leading-relaxed"
              placeholder={topics.length === 0 ? 'Add a topic first, then click Generate...' : 'Click Generate to create a draft, or start typing...'}
              style={{ minHeight: '300px' }}
            />
            <div className="px-6 py-4 border-t border-white/5 flex items-center gap-4">
              <button onClick={sendToExtension} disabled={!draft}
                className="px-4 py-2.5 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-40">
                <span className="material-symbols-outlined text-sm">send</span>
                {sent ? 'Sent!' : 'Send to Extension'}
              </button>
              <button onClick={copyDraft} disabled={!draft}
                className="px-4 py-2 border border-white/5 hover:border-primary/30 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-40">
                <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: AI Controls */}
        <div className="lg:col-span-4 space-y-6 overflow-y-auto">
          {/* Hook Variations */}
          {hooks.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-xs font-black text-muted uppercase tracking-[0.15em]">Suggested Hooks</h3>
              {hooks.map((hook, i) => (
                <button key={i} onClick={() => setDraft(hook)}
                  className="w-full text-left p-3 rounded-xl border border-white/5 bg-[#0A0A0B] hover:border-primary/30 transition-all group">
                  <p className="text-xs text-gray-300 group-hover:text-white">{hook}</p>
                </button>
              ))}
            </section>
          )}

          {/* Tone Control */}
          <section className="glass-panel p-5 rounded-xl border border-white/5 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-xs font-bold text-muted">Tone</label>
                <span className="text-[10px] text-primary font-black uppercase tracking-wider">{toneLabel}</span>
              </div>
              <input type="range" min={0} max={100} value={tone} onChange={e => setTone(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary" />
              <div className="flex justify-between text-[9px] text-muted font-bold">
                <span>Professional</span>
                <span>Balanced</span>
                <span>Provocative</span>
              </div>
            </div>

            <button onClick={generate} disabled={generating || !selectedTopic}
              className="w-full py-3 bg-white/[0.03] border border-dashed border-white/10 text-primary text-xs font-bold rounded-xl hover:bg-white/[0.06] hover:border-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40">
              <span className="material-symbols-outlined text-sm">refresh</span>
              {generating ? 'Regenerating...' : 'Regenerate All'}
            </button>
          </section>

          {/* Persona Info */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-sm text-primary">psychology</span>
            </div>
            <div>
              <p className="text-[10px] text-primary font-black uppercase tracking-wider">AI Persona Active</p>
              <p className="text-[8px] text-muted">Adapting to your writing style profile</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
