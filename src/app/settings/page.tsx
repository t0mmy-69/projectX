"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/authHeaders';
import { useToast } from '@/components/ToastProvider';

type LLMProvider = 'claude' | 'openai' | 'grok' | 'gemini' | 'deepseek';

const PROVIDER_INFO: Record<LLMProvider, { label: string; icon: string; placeholder: string; docsUrl: string }> = {
  claude:   { label: 'Anthropic (Claude)',  icon: '🧠', placeholder: 'sk-ant-api03-...', docsUrl: 'https://console.anthropic.com/settings/keys' },
  openai:   { label: 'OpenAI (GPT)',        icon: '✨', placeholder: 'sk-proj-...', docsUrl: 'https://platform.openai.com/api-keys' },
  grok:     { label: 'xAI (Grok)',          icon: '⚡', placeholder: 'xai-...', docsUrl: 'https://console.x.ai/team/default/api-keys' },
  gemini:   { label: 'Google (Gemini)',     icon: '💎', placeholder: 'AIzaSy...', docsUrl: 'https://aistudio.google.com/app/apikey' },
  deepseek: { label: 'DeepSeek',            icon: '🔍', placeholder: 'sk-...', docsUrl: 'https://platform.deepseek.com/api_keys' },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Persona');
  const [profile, setProfile] = useState<any>(null);
  const [extensionToken, setExtensionToken] = useState('');
  const [tokenGenerating, setTokenGenerating] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [xHandle, setXHandle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  // LLM keys state
  const [llmKeys, setLlmKeys] = useState<Record<LLMProvider, { has_key: boolean; masked?: string }>>({
    claude: { has_key: false }, openai: { has_key: false }, grok: { has_key: false },
    gemini: { has_key: false }, deepseek: { has_key: false },
  });
  const [llmInputs, setLlmInputs] = useState<Record<LLMProvider, string>>({
    claude: '', openai: '', grok: '', gemini: '', deepseek: '',
  });
  const [savingKey, setSavingKey] = useState<LLMProvider | null>(null);
  const { showToast } = useToast();

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

  const loadLLMKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/user/llm-keys', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setLlmKeys(data.data);
    } catch {}
  }, []);

  useEffect(() => {
    loadProfile();
    loadLLMKeys();
  }, [loadProfile, loadLLMKeys]);

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

  const saveLLMKey = async (provider: LLMProvider) => {
    const key = llmInputs[provider].trim();
    if (!key) { showToast('Enter an API key first', 'error'); return; }
    setSavingKey(provider);
    try {
      const res = await fetch('/api/user/llm-keys', {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ provider, api_key: key }),
      });
      const data = await res.json();
      if (data.success) {
        setLlmInputs(prev => ({ ...prev, [provider]: '' }));
        await loadLLMKeys();
        showToast(`${PROVIDER_INFO[provider].label} key saved!`, 'success');
      } else {
        showToast(data.error || 'Failed to save key', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    setSavingKey(null);
  };

  const deleteLLMKey = async (provider: LLMProvider) => {
    if (!confirm(`Remove ${PROVIDER_INFO[provider].label} API key?`)) return;
    try {
      await fetch(`/api/user/llm-keys?provider=${provider}`, { method: 'DELETE', headers: getAuthHeaders() });
      await loadLLMKeys();
      showToast('Key removed', 'info');
    } catch {}
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ x_username: xHandle }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMsg('Saved!');
        await loadProfile();
        showToast('Settings saved', 'success');
      } else {
        setSaveMsg('Error saving');
        showToast(data.error || 'Error saving settings', 'error');
      }
    } catch { setSaveMsg('Error saving'); showToast('Network error while saving', 'error'); }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST', headers: getAuthHeaders(false) }).catch(() => {});
    localStorage.removeItem('narrativeOS_auth');
    window.location.href = '/login';
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-8">
        <div className="flex justify-end">
          <button onClick={logout} className="px-4 py-2.5 border border-red-500/30 text-red-300 rounded-xl text-sm font-bold hover:bg-red-500/10 transition-all">
            Logout
          </button>
        </div>
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
                      aria-label="X handle"
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
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-1">LLM API Keys</h3>
                <p className="text-sm text-muted">Add API keys for each LLM provider. Used by your Agents for auto-reply on X.</p>
              </div>

              {(Object.keys(PROVIDER_INFO) as LLMProvider[]).map(provider => {
                const info    = PROVIDER_INFO[provider];
                const keyInfo = llmKeys[provider];
                const inputVal = llmInputs[provider];
                const isSaving = savingKey === provider;

                return (
                  <div key={provider} className="p-4 bg-[#0A0A0B] border border-white/5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{info.icon}</span>
                        <span className="text-sm font-bold">{info.label}</span>
                        {keyInfo.has_key && (
                          <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 text-[9px] font-black uppercase tracking-wider">Active</span>
                        )}
                      </div>
                      <a href={info.docsUrl} target="_blank" rel="noreferrer"
                        className="text-[10px] text-muted hover:text-primary transition-colors">
                        Get key ↗
                      </a>
                    </div>

                    {keyInfo.has_key ? (
                      <div className="flex items-center justify-between bg-black/60 p-3 rounded-lg border border-green-500/20">
                        <code className="text-xs font-mono text-green-400">{keyInfo.masked}</code>
                        <button onClick={() => deleteLLMKey(provider)} className="text-xs text-muted hover:text-red-400 transition-colors font-bold ml-3">Remove</button>
                      </div>
                    ) : null}

                    <div className="flex gap-2">
                      <input type="password" value={inputVal}
                        onChange={e => setLlmInputs(prev => ({ ...prev, [provider]: e.target.value }))}
                        placeholder={keyInfo.has_key ? 'Enter new key to replace...' : info.placeholder}
                        aria-label={`${info.label} API key`}
                        className="flex-1 bg-black border border-white/5 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-sm font-mono" />
                      <button onClick={() => saveLLMKey(provider)} disabled={isSaving || !inputVal.trim()}
                        className="px-4 py-2 bg-primary hover:bg-primary-light text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50">
                        {isSaving ? '...' : 'Save'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-5 rounded-xl border border-orange-500/20 bg-orange-500/5">
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <span className="material-symbols-outlined text-sm">info</span>
                <span className="text-xs font-bold uppercase tracking-wider">Privacy Note</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Your API keys are stored per-user and never logged or shared. They are only used when your agents generate replies via the Chrome Extension.
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
