// NarrativeOS Extension Options Script
// Separated from options.html to comply with CSP (Manifest V3)

const STORAGE_KEYS = {
  TOKEN: 'narrativeOS_extension_token',
  USER_ID: 'narrativeOS_user_id',
  API_BASE: 'narrativeOS_api_base'
};

const DEFAULT_API = 'https://project-x-lilac.vercel.app/api';

async function init() {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.API_BASE,
    STORAGE_KEYS.TOKEN,
    STORAGE_KEYS.USER_ID
  ]);

  const apiBaseInput = document.getElementById('api-base-input');
  const resolvedAPI = normalizeAPIBase(result[STORAGE_KEYS.API_BASE] || DEFAULT_API);
  if (resolvedAPI !== result[STORAGE_KEYS.API_BASE]) {
    await chrome.storage.local.set({ [STORAGE_KEYS.API_BASE]: resolvedAPI });
  }
  if (apiBaseInput) {
    apiBaseInput.value = resolvedAPI;
  }

  // Show debug info
  const debugEl = document.getElementById('debug-info');
  if (debugEl) {
    debugEl.innerHTML = [
      `API URL: ${result[STORAGE_KEYS.API_BASE] || DEFAULT_API}`,
      `Resolved API URL: ${resolvedAPI}`,
      `Token: ${result[STORAGE_KEYS.TOKEN] ? result[STORAGE_KEYS.TOKEN].substring(0, 8) + '...' : 'Not set'}`,
      `User ID: ${result[STORAGE_KEYS.USER_ID] || 'Not set'}`,
      `Extension ID: ${chrome.runtime.id}`
    ].join('<br>');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  init();

  document.getElementById('save-btn')?.addEventListener('click', async () => {
    const url = document.getElementById('api-base-input')?.value.trim();
    if (!url) {
      showMessage('save-message', 'Please enter a valid URL', 'error');
      return;
    }
    const normalized = normalizeAPIBase(url);
    await chrome.storage.local.set({ [STORAGE_KEYS.API_BASE]: normalized });
    showMessage('save-message', 'Settings saved!', 'success');
    await init();
  });

  document.getElementById('test-btn')?.addEventListener('click', async () => {
    const inputEl = document.getElementById('api-base-input');
    const url = normalizeAPIBase(inputEl?.value.trim() || DEFAULT_API);
    const dot = document.getElementById('conn-dot');
    const text = document.getElementById('conn-text');

    if (dot) dot.className = 'dot';
    if (text) text.textContent = 'Testing...';

    try {
      const res = await fetch(`${url}/topics`, {
        method: 'GET',
        headers: { 'x-user-id': 'test' },
        signal: AbortSignal.timeout(5000)
      });

      if (res.ok || res.status === 401 || res.status === 403) {
        if (dot) dot.className = 'dot ok';
        if (text) text.textContent = `Connected — server responded (${res.status})`;
      } else {
        if (dot) dot.className = 'dot err';
        if (text) text.textContent = `Server error: ${res.status}`;
      }
    } catch (e) {
      if (dot) dot.className = 'dot err';
      if (text) text.textContent = `Cannot reach server: ${e.message}`;
    }
  });
});

function showMessage(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `message ${type}`;
  setTimeout(() => {
    el.textContent = '';
    el.className = 'message';
  }, 3000);
}

function normalizeAPIBase(url) {
  const cleaned = (url || '').trim().replace(/\/+$/, '');
  if (!cleaned) return DEFAULT_API;
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
}
