"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem('narrativeOS_auth');
  if (!stored) return {};
  try {
    const u = JSON.parse(stored);
    return { 'Authorization': `Bearer ${u.token}`, 'x-user-id': u.id, 'Content-Type': 'application/json' };
  } catch { return {}; }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Persona');
  const [profile, setProfile] = useState<any>(null);
  const [extensionToken, setExtensionToken] = useState('');
  const [tokenGenerating, setTokenGenerating] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [llmApiKey, setLlmApiKey] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setXHandle(data.data.x_username || '');
      }
    } catch {}
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const generateToken = async () => {
    setTokenGenerating(true);
    try {
      const res = await fetch('/api/extension', { method: 'POST', headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setExtensionToken(data.data.token);
    } catch {}
    setTokenGenerating(false);
  };

  const copyToken = () => {
    if (!extensionToken) return;
    navigator.clipboard.writeText(extensionToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ x_username: xHandle, llm_api_key: llmApiKey || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMsg('Saved!');
        await loadProfile();
      } else {
        setSaveMsg('Error saving');
      }
    } catch { setSaveMsg('Error saving'); }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('narrativeOS_auth');
    window.location.href = '/login';
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-8">
        {/* Tabs */}
        <div className="flex border-b border-white/5 gap-8">
          {['Persona', 'Extension', 'API Keys', 'Security'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-bold transition-all relative ${activeTab === tab ? 'text-white' : 'text-muted hover:text-white'}`}>
              {tab}
              {activeTab === tab && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(129,74,200,0.5)]" />}
            </button>
          ))}
        </div>

        {activeTab === 'Persona' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">psychology</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">AI Persona</h3>
                  <p className="text-xs text-muted">{profile ? `Account: ${profile.email}` : 'Loading...'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">X Handle</label>
                  <div className="flex gap-2">
                    <span className="bg-[#0A0A0B] border border-white/5 rounded-l-xl px-4 py-3 text-muted border-r-0 font-bold text-sm">@</span>
                    <input type="text" value={xHandle} onChange={e => setXHandle(e.target.value)} placeholder="yourusername"
                      className="flex-1 bg-[#0A0A0B] border border-white/5 rounded-r-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm" />
                  </div>
                  <p className="text-xs text-muted">Used to analyze your writing style and build your AI persona.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={saveProfile} disabled={saving}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-light text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  {saveMsg && <span className={`text-sm font-bold ${saveMsg === 'Saved!' ? 'text-green-400' : 'text-red-400'}`}>{saveMsg}</span>}
                </div>
              </div>
            </div>

            {profile && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                  <div className="text-[10px] text-muted uppercase font-black mb-1 tracking-wider">Topics</div>
                  <div className="text-xl font-bold">{profile.topics_count}</div>
                </div>
                <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                  <div className="text-[10px] text-muted uppercase font-black mb-1 tracking-wider">Drafts Generated</div>
                  <div className="text-xl font-bold">{profile.drafts_count}</div>
                </div>
                <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                  <div className="text-[10px] text-muted uppercase font-black mb-1 tracking-wider">Plan</div>
                  <div className="text-xl font-bold capitalize">{profile.subscription_tier}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Extension' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">extension</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Extension Connection</h3>
                  <p className="text-xs text-muted">Generate a token to connect the Chrome Extension</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-[#0A0A0B] border border-white/5 rounded-xl">
                  <div className="text-[10px] text-muted uppercase font-black mb-3 tracking-wider">Connection Token</div>
                  {extensionToken ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-black/60 p-3 rounded-lg border border-primary/20">
                        <code className="text-xs font-mono text-primary truncate flex-1">{extensionToken}</code>
                        <button onClick={copyToken} className="ml-2 flex-shrink-0 flex items-center gap-1 text-xs text-muted hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-sm">{tokenCopied ? 'check' : 'content_copy'}</span>
                          {tokenCopied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-xs text-muted">Paste this token in the NarrativeOS Extension popup → Connect.</p>
                      <button onClick={generateToken} className="text-xs text-primary hover:text-primary-light font-bold">Generate new token</button>
                    </div>
                  ) : (
                    <button onClick={generateToken} disabled={tokenGenerating}
                      className="w-full py-4 bg-primary/10 border border-primary/20 hover:bg-primary/20 rounded-xl text-primary font-bold transition-colors disabled:opacity-50">
                      {tokenGenerating ? 'Generating...' : '⚡ Generate Extension Token'}
                    </button>
                  )}
                </div>

                <div className="p-4 bg-[#0A0A0B] border border-white/5 rounded-xl space-y-3">
                  <h4 className="text-sm font-bold">How to Connect</h4>
                  <ol className="text-xs text-muted space-y-2 list-none">
                    <li className="flex items-start gap-2"><span className="text-primary font-bold flex-shrink-0">1.</span> Install the NarrativeOS Chrome Extension</li>
                    <li className="flex items-start gap-2"><span className="text-primary font-bold flex-shrink-0">2.</span> Generate a token above</li>
                    <li className="flex items-start gap-2"><span className="text-primary font-bold flex-shrink-0">3.</span> Click the extension icon → Paste token → Connect</li>
                    <li className="flex items-start gap-2"><span className="text-primary font-bold flex-shrink-0">4.</span> Go to twitter.com/x.com — extension is now active!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'API Keys' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-lg font-bold">LLM API Key</h3>
              <p className="text-sm text-muted">Add your own API key for AI-powered auto-replies in the Chrome Extension.</p>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Anthropic / OpenAI API Key</label>
                <input type="password" value={llmApiKey} onChange={e => setLlmApiKey(e.target.value)}
                  placeholder="sk-ant-... or sk-..."
                  className="w-full bg-[#0A0A0B] border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm font-mono" />
                <p className="text-xs text-muted">Stored securely per-user. Used for extension auto-reply generation.</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={saveProfile} disabled={saving}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-light text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save API Key'}
                </button>
                {saveMsg && <span className={`text-sm font-bold ${saveMsg === 'Saved!' ? 'text-green-400' : 'text-red-400'}`}>{saveMsg}</span>}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-orange-500/20 bg-orange-500/5">
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <span className="material-symbols-outlined text-sm">info</span>
                <span className="text-xs font-bold uppercase tracking-wider">Privacy Note</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Your API key is stored in our database associated with your account and never logged or shared. It is only used when you trigger auto-reply from the extension.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'Security' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-lg font-bold">Account Security</h3>
              {profile && (
                <div className="space-y-3">
                  <div className="p-4 bg-[#0A0A0B] border border-white/5 rounded-xl">
                    <div className="text-[10px] text-muted uppercase font-black mb-1 tracking-wider">Email</div>
                    <div className="text-sm font-bold">{profile.email}</div>
                  </div>
                  <div className="p-4 bg-[#0A0A0B] border border-white/5 rounded-xl">
                    <div className="text-[10px] text-muted uppercase font-black mb-1 tracking-wider">Account Created</div>
                    <div className="text-sm font-bold">{new Date(profile.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
              <h3 className="text-sm font-bold text-red-400 mb-3">Danger Zone</h3>
              <button onClick={logout} className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-all">
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
