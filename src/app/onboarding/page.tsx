"use client";

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '@/lib/authHeaders';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [topicInput, setTopicInput] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [xHandle, setXHandle] = useState('');
  const [selectedKols, setSelectedKols] = useState<string[]>([]);
  const [extensionToken, setExtensionToken] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const saveTopic = (kw: string) => {
    if (kw && !topics.includes(kw)) setTopics(prev => [...prev, kw]);
  };

  const continueStep1 = useCallback(async () => {
    setLoading(true);
    try {
      const kws = topicInput.split(',').map(k => k.trim()).filter(Boolean);
      for (const kw of kws) saveTopic(kw);
      const allTopics = [...new Set([...topics, ...kws])];
      for (const kw of allTopics) {
        await fetch('/api/topics', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ keyword: kw }),
        });
      }
    } catch {}
    setLoading(false);
    setStep(2);
  }, [topicInput, topics]);

  const continueStep3 = useCallback(async () => {
    setLoading(true);
    try {
      if (xHandle) {
        await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ x_username: xHandle }),
        });
      }
    } catch {}
    setLoading(false);
    setStep(4);
  }, [xHandle]);

  const continueStep2 = useCallback(async () => {
    setLoading(true);
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ tracked_kols: selectedKols }),
      });
    } catch {}
    setLoading(false);
    setStep(3);
  }, [selectedKols]);

  const generateToken = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/extension', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) setExtensionToken(data.data.token);
    } catch {}
    setLoading(false);
  }, []);

  const copyToken = () => {
    if (extensionToken) {
      navigator.clipboard.writeText(extensionToken);
    }
  };

  const skip = () => router.push('/dashboard');
  const finish = () => router.push('/dashboard');

  const QUICK_TOPICS = ['AI Tech', 'Web3', 'Product Design', 'Crypto', 'Startups', 'Marketing'];
  const KOLS = [
    { name: 'Naval', handle: '@naval', niche: 'Philosophy' },
    { name: 'Balaji S. Srinivasan', handle: '@balajis', niche: 'Tech/Network States' },
    { name: 'Paul Graham', handle: '@paulg', niche: 'Startups' },
    { name: 'Tobi Lütke', handle: '@tobi', niche: 'E-commerce' },
    { name: 'Vitalik Buterin', handle: '@VitalikButerin', niche: 'Ethereum' },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="hero-glow !top-1/2 !-translate-y-1/2"></div>
      <div className="w-full max-w-xl relative z-10">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-primary shadow-[0_0_8px_rgba(129,74,200,0.4)]' : 'bg-white/5'}`} />
          ))}
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-white/5 shadow-2xl">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold mb-2 tracking-tight">What topics do you track?</h1>
                <p className="text-muted text-sm font-medium">Define your niche. Separate multiple topics with commas.</p>
              </div>
              <div className="space-y-4">
                <input type="text" value={topicInput} onChange={e => setTopicInput(e.target.value)}
                  placeholder="e.g. AI Agents, Solana DeFi, SaaS Growth"
                  aria-label="Topics input"
                  className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                <div className="flex flex-wrap gap-2">
                  {QUICK_TOPICS.map(tag => (
                    <button key={tag} onClick={() => setTopicInput(p => p ? `${p}, ${tag}` : tag)}
                      className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={skip} className="px-4 py-4 border border-white/5 hover:bg-white/5 rounded-xl font-bold text-sm transition-all text-muted">Skip</button>
                <button onClick={continueStep1} disabled={loading}
                  className="flex-1 py-4 bg-primary hover:bg-primary-light rounded-xl font-bold transition-all duration-300 shadow-[0_0_25px_rgba(129,74,200,0.25)] disabled:opacity-50">
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold mb-2 tracking-tight">Follow the Narrative</h1>
                <p className="text-muted text-sm font-medium">Select Key Opinion Leaders (KOLs) to monitor.</p>
              </div>
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {KOLS.map(kol => (
                  <button
                    key={kol.handle}
                    type="button"
                    onClick={() => setSelectedKols(prev => prev.includes(kol.handle) ? prev.filter(h => h !== kol.handle) : [...prev, kol.handle])}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${selectedKols.includes(kol.handle) ? 'bg-primary/10 border-primary/40' : 'bg-white/[0.03] border-white/5 hover:border-primary/30'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold">{kol.name}</p>
                      <p className="text-[10px] text-muted">{kol.handle} • {kol.niche}</p>
                    </div>
                    {selectedKols.includes(kol.handle) && (
                      <span className="material-symbols-outlined text-primary ml-auto text-sm">check_circle</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={skip} className="px-4 py-4 border border-white/5 hover:bg-white/5 rounded-xl font-bold text-sm transition-all text-muted">Skip</button>
                <button onClick={continueStep2} disabled={loading} className="flex-1 py-4 bg-primary hover:bg-primary-light rounded-xl font-bold transition-all duration-300 shadow-[0_0_25px_rgba(129,74,200,0.25)] disabled:opacity-50">
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold mb-2 tracking-tight">Train your AI Persona</h1>
                <p className="text-muted text-sm font-medium">Provide your X handle to clone your writing style.</p>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <span className="bg-[#0A0A0B] border border-white/5 rounded-l-xl px-4 py-3.5 text-muted border-r-0 font-bold">@</span>
                  <input type="text" value={xHandle} onChange={e => setXHandle(e.target.value)} placeholder="username"
                    aria-label="X username"
                    className="flex-1 bg-[#0A0A0B] border border-white/5 rounded-r-xl px-4 py-3.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                </div>
                <p className="text-xs text-muted text-center">Optional — you can set this later in Settings.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={skip} className="px-4 py-4 border border-white/5 hover:bg-white/5 rounded-xl font-bold text-sm transition-all text-muted">Skip</button>
                <button onClick={continueStep3} disabled={loading}
                  className="flex-1 py-4 bg-primary hover:bg-primary-light rounded-xl font-bold transition-all duration-300 shadow-[0_0_25px_rgba(129,74,200,0.25)] disabled:opacity-50">
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold mb-2 tracking-tight">Connect Extension</h1>
                <p className="text-muted text-sm font-medium">Generate a token to connect the NarrativeOS Chrome Extension.</p>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-[#0A0A0B] border border-white/5 rounded-xl">
                  <div className="text-[10px] text-muted uppercase font-black mb-3 tracking-wider">Your Connection Token</div>
                  {extensionToken ? (
                    <div className="flex items-center justify-between bg-black/60 p-3 rounded-lg border border-white/5">
                      <code className="text-xs font-mono text-primary truncate flex-1">{extensionToken}</code>
                      <button onClick={copyToken} className="ml-2 flex-shrink-0">
                        <span className="material-symbols-outlined text-sm cursor-pointer text-muted hover:text-white transition-colors">content_copy</span>
                      </button>
                    </div>
                  ) : (
                    <button onClick={generateToken} disabled={loading}
                      className="w-full py-3 bg-primary/10 border border-primary/20 hover:bg-primary/20 rounded-xl text-primary text-sm font-bold transition-colors disabled:opacity-50">
                      {loading ? 'Generating...' : '⚡ Generate Token'}
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted text-center">You can also generate a token anytime in Settings → Extension.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={skip} className="px-4 py-4 border border-white/5 hover:bg-white/5 rounded-xl font-bold text-sm transition-all text-muted">Skip</button>
                <button onClick={finish} className="flex-1 py-4 bg-primary hover:bg-primary-light rounded-xl font-bold transition-all duration-300 shadow-[0_0_25px_rgba(129,74,200,0.25)]">
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center mt-8 text-muted text-xs font-bold">Step {step} of 4</p>
      </div>
    </div>
  );
}
