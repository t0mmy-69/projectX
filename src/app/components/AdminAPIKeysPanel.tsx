"use client";

import React, { useState, useEffect } from 'react';

interface APIKey {
  id: string;
  key_name: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

interface KeyInput {
  key_name: string;
  key_value: string;
}

export default function AdminAPIKeysPanel() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [formData, setFormData] = useState<KeyInput>({ key_name: '', key_value: '' });
  const [showForm, setShowForm] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: Record<string, string> = {
      'x-user-id': 'admin',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/api-keys', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }

      const data = await response.json();
      setKeys(data.data.keys);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.key_name || !formData.key_value) {
      setError('Key name and value are required');
      return;
    }

    try {
      setAdding(true);
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key_name: formData.key_name,
          key_value: formData.key_value,
          validate_only: false,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add API key');
      }

      setSuccess(`API key ${formData.key_name} saved successfully`);
      setFormData({ key_name: '', key_value: '' });
      setShowForm(false);
      await fetchKeys();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleTestKey = async (keyName: string) => {
    try {
      setTesting(keyName);
      const response = await fetch('/api/admin/api-keys', {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key_name: keyName,
          action: 'test',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Test failed');
      }

      const data = await response.json();
      setSuccess(`${keyName} test passed (${data.latency_ms}ms)`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTesting(null);
    }
  };

  const handleDeleteKey = async (keyName: string) => {
    if (!confirm(`Are you sure you want to delete ${keyName}?`)) {
      return;
    }

    try {
      setDeleting(keyName);
      const response = await fetch('/api/admin/api-keys', {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key_name: keyName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete API key');
      }

      setSuccess(`API key ${keyName} deleted`);
      await fetchKeys();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-[var(--secondary-bg)] p-6 rounded-2xl border border-[var(--border-color)]">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">vpn_key</span>
            API Keys Management
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Manage Claude, X API, and OAuth credentials</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold hover:bg-amber-500/20 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add Key
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          {success}
        </div>
      )}

      {/* Add Key Form */}
      {showForm && (
        <form onSubmit={handleAddKey} className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase">Key Name</label>
            <select
              value={formData.key_name}
              onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-amber-500"
            >
              <option value="">Select a key type...</option>
              <option value="ANTHROPIC_API_KEY">Claude API Key (sk-ant-...)</option>
              <option value="X_API_TOKEN">X API Bearer Token</option>
              <option value="X_CLIENT_ID">X OAuth Client ID</option>
              <option value="X_CLIENT_SECRET">X OAuth Client Secret</option>
              <option value="X_REDIRECT_URI">X OAuth Redirect URI</option>
              <option value="DATABASE_URL">Database URL</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 uppercase">Key Value</label>
            <input
              type="password"
              value={formData.key_value}
              onChange={(e) => setFormData({ ...formData, key_value: e.target.value })}
              placeholder="Paste your API key here..."
              className="w-full px-3 py-2 bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Your key will be validated and tested before saving.</p>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding}
              className="px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? 'Saving...' : 'Save Key'}
            </button>
          </div>
        </form>
      )}

      {/* Keys List */}
      {loading ? (
        <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--secondary-bg)] text-center text-[var(--text-muted)]">
          <span className="material-symbols-outlined animate-spin inline-block">sync</span>
          <p className="mt-2 text-sm">Loading API keys...</p>
        </div>
      ) : keys.length === 0 ? (
        <div className="p-6 rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--secondary-bg)] text-center text-[var(--text-muted)]">
          <span className="material-symbols-outlined text-2xl block mb-2">vpn_key</span>
          <p className="text-sm">No API keys configured yet</p>
          <p className="text-[10px] mt-1">Add your first API key to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--secondary-bg)] flex items-center justify-between hover:border-[var(--border-color)]/70 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${key.is_active ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-main)]">{key.key_name}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      {key.is_active ? 'Active' : 'Inactive'} •
                      {key.last_used_at
                        ? ` Last used ${new Date(key.last_used_at).toLocaleDateString()}`
                        : ' Never used'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleTestKey(key.key_name)}
                  disabled={testing === key.key_name}
                  className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-bold hover:bg-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">
                    {testing === key.key_name ? 'sync' : 'check'}
                  </span>
                  Test
                </button>
                <button
                  onClick={() => handleDeleteKey(key.key_name)}
                  disabled={deleting === key.key_name}
                  className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-bold hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">
                    {deleting === key.key_name ? 'sync' : 'delete'}
                  </span>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Required Keys Info */}
      <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5 text-[10px] text-[var(--text-muted)] space-y-2">
        <p className="font-bold text-blue-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-xs">info</span>
          Required API Keys for Full Functionality
        </p>
        <ul className="space-y-1 ml-6">
          <li>• <strong>ANTHROPIC_API_KEY</strong> - Claude API for AI features (starts with sk-ant-)</li>
          <li>• <strong>X_API_TOKEN</strong> - X API Bearer token for scraping</li>
          <li>• <strong>X_CLIENT_ID</strong> & <strong>X_CLIENT_SECRET</strong> - OAuth credentials</li>
          <li>• <strong>X_REDIRECT_URI</strong> - OAuth callback URL</li>
          <li>• <strong>DATABASE_URL</strong> - PostgreSQL connection string</li>
        </ul>
      </div>
    </div>
  );
}
