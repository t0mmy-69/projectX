// NarrativeOS Extension Popup v2.0
// Email/password login → JWT stored → Agent selector → Auto-reply toggle

const DEFAULT_API_BASE = 'https://project-x-lilac.vercel.app/api';

const KEYS = {
  JWT:           'narrativeOS_jwt',
  USER_ID:       'narrativeOS_user_id',
  USER_EMAIL:    'narrativeOS_user_email',
  AGENT_ID:      'narrativeOS_agent_id',
  AUTO_REPLY:    'narrativeOS_auto_reply_enabled',
  API_BASE:      'narrativeOS_api_base',
  STAT_REPLIES:  'narrativeOS_stat_replies',
  STAT_SCANNED:  'narrativeOS_stat_scanned',
};

// ─── DOM refs ───────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getAPIBase() {
  const r = await chrome.storage.local.get(KEYS.API_BASE);
  const stored = (r[KEYS.API_BASE] || '').trim().replace(/\/+$/, '');
  if (!stored) return DEFAULT_API_BASE;
  return stored.endsWith('/api') ? stored : `${stored}/api`;
}

async function get(key) {
  const r = await chrome.storage.local.get(key);
  return r[key];
}

async function set(obj) {
  await chrome.storage.local.set(obj);
}

function showMsg(elId, text, type = '') {
  const el = $(elId);
  if (!el) return;
  el.textContent = text;
  el.className = `message ${type}`;
  if (type === 'success') setTimeout(() => { el.textContent = ''; el.className = 'message'; }, 3000);
}

function showLoading(show) {
  const l = $('loading');
  if (l) l.style.display = show ? 'flex' : 'none';
  const btn = $('login-btn');
  if (btn) btn.disabled = show;
}

// ─── Initialize ───────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const jwt       = await get(KEYS.JWT);
  const userId    = await get(KEYS.USER_ID);
  const userEmail = await get(KEYS.USER_EMAIL);

  if (jwt && userId) {
    await showAuthenticatedUI(userEmail || userId);
  } else {
    showLoginUI();
  }

  setupListeners();
});

function setupListeners() {
  $('login-btn')?.addEventListener('click', handleLogin);
  $('logout-btn')?.addEventListener('click', handleLogout);
  $('auto-reply-toggle')?.addEventListener('change', handleAutoReplyToggle);
  $('options-link')?.addEventListener('click', () => chrome.runtime.openOptionsPage());
  $('agent-select')?.addEventListener('change', handleAgentChange);
  $('password-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
}

// ─── Login ────────────────────────────────────────────────────────────────────

async function handleLogin() {
  const email    = $('email-input')?.value.trim();
  const password = $('password-input')?.value.trim();

  if (!email || !password) {
    showMsg('error-message', 'Enter email and password', 'error');
    return;
  }

  showLoading(true);
  showMsg('error-message', '', '');

  try {
    const API_BASE = await getAPIBase();
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.success && data.data?.token) {
      await set({
        [KEYS.JWT]:        data.data.token,
        [KEYS.USER_ID]:    data.data.user_id || data.data.id,
        [KEYS.USER_EMAIL]: data.data.email || email,
      });
      $('password-input').value = '';
      await showAuthenticatedUI(data.data.email || email);
    } else {
      showMsg('error-message', data.error || 'Login failed', 'error');
    }
  } catch {
    showMsg('error-message', 'Cannot reach server. Check API URL in Options.', 'error');
  }

  showLoading(false);
}

// ─── Logout ───────────────────────────────────────────────────────────────────

async function handleLogout() {
  const jwt = await get(KEYS.JWT);
  const API_BASE = await getAPIBase();
  if (jwt) {
    fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${jwt}` },
    }).catch(() => {});
  }
  await chrome.storage.local.remove([KEYS.JWT, KEYS.USER_ID, KEYS.USER_EMAIL]);
  // Notify content script to disable auto-reply
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]?.id) chrome.tabs.sendMessage(tabs[0].id, { action: 'setAutoReply', enabled: false }).catch(() => {});
  });
  showLoginUI();
}

// ─── UI State ─────────────────────────────────────────────────────────────────

function showLoginUI() {
  $('login-section').style.display = 'block';
  $('authenticated-section').style.display = 'none';
  $('status-dot').className = 'status-dot disconnected';
  $('status-text').textContent = 'Not signed in';
  $('replies-today').textContent = '';
}

async function showAuthenticatedUI(email) {
  $('login-section').style.display = 'none';
  $('authenticated-section').style.display = 'block';
  $('status-dot').className = 'status-dot connected';
  $('status-text').textContent = 'Connected';
  $('user-email-display').textContent = email;

  // Load agents
  await loadAgents();

  // Load stats from storage
  const replies = (await get(KEYS.STAT_REPLIES)) || 0;
  const scanned = (await get(KEYS.STAT_SCANNED)) || 0;
  $('stat-replies').textContent = replies;
  $('stat-scanned').textContent = scanned;
  $('replies-today').textContent = replies > 0 ? `${replies} replies today` : '';

  // Restore toggle state
  const autoReply  = await get(KEYS.AUTO_REPLY);
  const toggle = $('auto-reply-toggle');
  if (toggle) toggle.checked = autoReply === 'true';
  updateToggleSubText();
}

// ─── Agents ───────────────────────────────────────────────────────────────────

async function loadAgents() {
  const jwt = await get(KEYS.JWT);
  if (!jwt) return;

  try {
    const API_BASE = await getAPIBase();
    const res = await fetch(`${API_BASE}/agents`, {
      headers: { 'Authorization': `Bearer ${jwt}` },
    });
    const data = await res.json();

    const select     = $('agent-select');
    const noAgents   = $('no-agents-msg');
    const savedAgent = await get(KEYS.AGENT_ID);

    if (data.success && data.data.length > 0) {
      select.innerHTML = '';
      data.data.forEach(agent => {
        const opt = document.createElement('option');
        opt.value = agent.id;
        opt.textContent = `${agent.is_active ? '● ' : '○ '}${agent.name} (${agent.llm_provider})`;
        if (agent.id === savedAgent) opt.selected = true;
        select.appendChild(opt);
      });
      select.style.display = 'block';
      if (noAgents) noAgents.style.display = 'none';

      // If no saved agent, select first active one
      if (!savedAgent) {
        const firstActive = data.data.find(a => a.is_active);
        if (firstActive) {
          select.value = firstActive.id;
          await set({ [KEYS.AGENT_ID]: firstActive.id });
        }
      }
    } else {
      if (select) select.style.display = 'none';
      if (noAgents) noAgents.style.display = 'block';
      // Disable toggle
      const toggle = $('auto-reply-toggle');
      if (toggle) toggle.disabled = true;
    }
  } catch {
    showMsg('error-message-auth', 'Could not load agents', 'error');
  }

  updateToggleSubText();
}

async function handleAgentChange(e) {
  const agentId = e.target.value;
  await set({ [KEYS.AGENT_ID]: agentId });
  // Notify content script about agent change
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'setAgent', agentId }).catch(() => {});
    }
  });
  updateToggleSubText();
}

// ─── Auto-Reply Toggle ────────────────────────────────────────────────────────

async function handleAutoReplyToggle(e) {
  const enabled = e.target.checked;
  const agentId = await get(KEYS.AGENT_ID);

  if (enabled && !agentId) {
    e.target.checked = false;
    showMsg('error-message-auth', 'Select an agent first', 'error');
    return;
  }

  await set({ [KEYS.AUTO_REPLY]: enabled.toString() });
  updateToggleSubText();

  // Notify content script
  const jwt = await get(KEYS.JWT);
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'setAutoReply',
        enabled,
        agentId: agentId || null,
        jwt: jwt || null,
      }).catch(() => {});
    }
  });
}

function updateToggleSubText() {
  const el = $('toggle-sub-text');
  if (!el) return;
  const select = $('agent-select');
  const hasAgent = select && select.value && select.style.display !== 'none';
  const isOn = $('auto-reply-toggle')?.checked;

  if (!hasAgent) {
    el.textContent = 'Select an agent to enable';
  } else if (isOn) {
    el.textContent = 'Scanning feed for matching posts...';
  } else {
    el.textContent = 'Click to start scanning your feed';
  }
}
