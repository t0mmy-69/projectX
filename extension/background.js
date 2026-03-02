// NarrativeOS Extension - Background Service Worker
// Handles: Token management, API communication, auto-reply execution

// API base URL - reads from storage (set in options), defaults to production
const DEFAULT_API_BASE = 'https://project-x-lilac.vercel.app/api';

const STORAGE_KEYS = {
  TOKEN: 'narrativeOS_extension_token',
  USER_ID: 'narrativeOS_user_id',
  AUTO_REPLY_ENABLED: 'narrativeOS_auto_reply_enabled',
  API_BASE: 'narrativeOS_api_base'
};

async function getAPIBase() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.API_BASE);
  const stored = result[STORAGE_KEYS.API_BASE];
  let normalized = normalizeAPIBase(stored || DEFAULT_API_BASE);

  // Migrate old local default from previous versions.
  if (normalized.includes('localhost:3001')) {
    normalized = DEFAULT_API_BASE;
    await chrome.storage.local.set({ [STORAGE_KEYS.API_BASE]: normalized });
  }

  return normalized;
}

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default API base on install
    chrome.storage.local.set({ [STORAGE_KEYS.API_BASE]: DEFAULT_API_BASE });
    chrome.runtime.openOptionsPage();
  }
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'validateToken') {
    validateToken(request.token).then(sendResponse);
    return true;
  }

  if (request.action === 'generateDraft') {
    generateDraft(request.data).then(sendResponse);
    return true;
  }

  if (request.action === 'checkAutoReply') {
    checkAutoReply(request.data).then(sendResponse);
    return true;
  }

  if (request.action === 'injectDraft') {
    sendResponse({ success: true, message: 'Draft injection handled' });
    return true;
  }

  if (request.action === 'getAPIBase') {
    getAPIBase().then(url => sendResponse({ url }));
    return true;
  }
});

async function validateToken(token) {
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
    }

    return data;
  } catch (error) {
    return { success: false, error: 'Cannot connect to NarrativeOS server. Check your API URL in settings.' };
  }
}

async function generateDraft(data) {
  try {
    const API_BASE = await getAPIBase();
    const token = await getStoredToken();
    const userId = await getStoredUserId();

    if (!token || !userId) {
      return { success: false, error: 'Not authenticated. Please connect your token first.' };
    }

    const response = await fetch(`${API_BASE}/extension/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-extension-token': token
      },
      body: JSON.stringify(data)
    });

    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function checkAutoReply(data) {
  try {
    const API_BASE = await getAPIBase();
    const token = await getStoredToken();
    const userId = await getStoredUserId();

    if (!token || !userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE}/extension/auto-reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-extension-token': token
      },
      body: JSON.stringify(data)
    });

    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getStoredToken() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.TOKEN);
  return result[STORAGE_KEYS.TOKEN];
}

async function getStoredUserId() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.USER_ID);
  return result[STORAGE_KEYS.USER_ID];
}

function normalizeAPIBase(url) {
  const cleaned = (url || '').trim().replace(/\/+$/, '');
  if (!cleaned) return DEFAULT_API_BASE;
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
}

// Periodic sync for auto-reply (every 5 minutes)
chrome.alarms.create('autoReplySyncAlarm', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'autoReplySyncAlarm') {
    const token = await getStoredToken();
    const userId = await getStoredUserId();
    const autoReplyEnabled = await chrome.storage.local.get(STORAGE_KEYS.AUTO_REPLY_ENABLED);

    if (token && userId && autoReplyEnabled[STORAGE_KEYS.AUTO_REPLY_ENABLED] === 'true') {
      console.log('[NarrativeOS] Auto-reply sync triggered');
      // Future: fetch pending replies from server and execute them
    }
  }
});
