// NarrativeOS Extension Popup Script

const DEFAULT_API_BASE = 'https://project-x-lilac.vercel.app/api';

const STORAGE_KEYS = {
  TOKEN: 'narrativeOS_extension_token',
  USER_ID: 'narrativeOS_user_id',
  AUTO_REPLY_ENABLED: 'narrativeOS_auto_reply_enabled',
  API_BASE: 'narrativeOS_api_base'
};

const elements = {
  status: document.getElementById('status'),
  statusDot: document.getElementById('status-dot'),
  statusText: document.getElementById('status-text'),
  authSection: document.getElementById('auth-section'),
  authenticatedSection: document.getElementById('authenticated-section'),
  tokenInput: document.getElementById('token-input'),
  authBtn: document.getElementById('auth-btn'),
  errorMessage: document.getElementById('error-message'),
  loading: document.getElementById('loading'),
  autoReplyToggle: document.getElementById('auto-reply-toggle'),
  settingsBtn: document.getElementById('settings-btn'),
  generateDraftBtn: document.getElementById('generate-draft-btn'),
  logoutBtn: document.getElementById('logout-btn'),
  userIdDisplay: document.getElementById('user-id-display')
};

async function getAPIBase() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.API_BASE);
  const stored = result[STORAGE_KEYS.API_BASE];
  let normalized = normalizeAPIBase(stored || DEFAULT_API_BASE);

  // Migrate old default that points to a non-running local server.
  if (normalized.includes('localhost:3001')) {
    normalized = DEFAULT_API_BASE;
    await chrome.storage.local.set({ [STORAGE_KEYS.API_BASE]: normalized });
  }

  return normalized;
}

function normalizeAPIBase(url) {
  const cleaned = (url || '').trim().replace(/\/+$/, '');
  if (!cleaned) return DEFAULT_API_BASE;
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
}

// Initialize
document.addEventListener('DOMContentLoaded', initializePopup);

async function initializePopup() {
  const token = await getStoredValue(STORAGE_KEYS.TOKEN);
  const userId = await getStoredValue(STORAGE_KEYS.USER_ID);
  const autoReplyEnabled = await getStoredValue(STORAGE_KEYS.AUTO_REPLY_ENABLED);

  if (token && userId) {
    showAuthenticatedUI(userId);
    if (elements.autoReplyToggle) {
      elements.autoReplyToggle.checked = autoReplyEnabled === 'true';
    }
  } else {
    showUnauthenticatedUI();
  }

  setupEventListeners();
}

function setupEventListeners() {
  elements.authBtn?.addEventListener('click', handleAuthentication);
  elements.logoutBtn?.addEventListener('click', handleLogout);
  elements.autoReplyToggle?.addEventListener('change', handleAutoReplyToggle);
  elements.settingsBtn?.addEventListener('click', () => chrome.runtime.openOptionsPage());
  elements.generateDraftBtn?.addEventListener('click', handleGenerateDraft);
  elements.tokenInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAuthentication();
  });
  // Footer options link (no inline onclick — CSP safe)
  document.getElementById('options-link')?.addEventListener('click', () => chrome.runtime.openOptionsPage());
}

async function handleAuthentication() {
  const token = elements.tokenInput?.value.trim();
  if (!token) {
    showError('Please enter a token');
    return;
  }

  showLoading(true);
  clearMessage();

  try {
    const API_BASE = await getAPIBase();
    const response = await fetch(`${API_BASE}/extension`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    const data = await response.json();

    if (data.success) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.TOKEN]: token,
        [STORAGE_KEYS.USER_ID]: data.data.user_id
      });

      if (elements.tokenInput) elements.tokenInput.value = '';
      showAuthenticatedUI(data.data.user_id);
      showSuccess('Connected to NarrativeOS!');
    } else {
      showError(data.error || 'Authentication failed. Check your token.');
    }
  } catch (error) {
    showError('Cannot reach server. Check API URL in Options.');
  } finally {
    showLoading(false);
  }
}

async function handleLogout() {
  await chrome.storage.local.remove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER_ID]);
  showUnauthenticatedUI();
  showSuccess('Disconnected successfully');
}

async function handleAutoReplyToggle(e) {
  const enabled = e.target.checked;
  await chrome.storage.local.set({
    [STORAGE_KEYS.AUTO_REPLY_ENABLED]: enabled.toString()
  });
}

function handleGenerateDraft() {
  showLoading(true);
  chrome.runtime.sendMessage(
    { action: 'generateDraft', data: { topic_id: 'current' } },
    (response) => {
      showLoading(false);
      if (response?.success) {
        showSuccess('Draft generated! Open X to see it.');
      } else {
        showError(response?.error || 'Failed to generate draft');
      }
    }
  );
}

function showAuthenticatedUI(userId) {
  if (elements.statusDot) elements.statusDot.className = 'status-dot connected';
  if (elements.statusText) elements.statusText.textContent = 'Connected to NarrativeOS';
  if (elements.authSection) elements.authSection.style.display = 'none';
  if (elements.authenticatedSection) elements.authenticatedSection.style.display = 'block';
  if (elements.userIdDisplay) {
    elements.userIdDisplay.textContent = `User: ${userId.substring(0, 12)}...`;
  }
}

function showUnauthenticatedUI() {
  if (elements.statusDot) elements.statusDot.className = 'status-dot disconnected';
  if (elements.statusText) elements.statusText.textContent = 'Not connected';
  if (elements.authSection) elements.authSection.style.display = 'block';
  if (elements.authenticatedSection) elements.authenticatedSection.style.display = 'none';
}

function showError(message) {
  if (elements.errorMessage) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.className = 'message error';
  }
}

function showSuccess(message) {
  if (elements.errorMessage) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.className = 'message success';
    setTimeout(clearMessage, 3000);
  }
}

function clearMessage() {
  if (elements.errorMessage) {
    elements.errorMessage.textContent = '';
    elements.errorMessage.className = 'message';
  }
}

function showLoading(show) {
  if (elements.loading) elements.loading.style.display = show ? 'flex' : 'none';
  if (elements.authBtn) elements.authBtn.disabled = show;
}

async function getStoredValue(key) {
  const result = await chrome.storage.local.get(key);
  return result[key];
}
