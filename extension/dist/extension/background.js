// NarrativeOS Extension - Background Service Worker v2.0
// Handles: API communication, auto-reply sync

const DEFAULT_API_BASE = 'https://project-x-lilac.vercel.app/api';

const STORAGE_KEYS = {
  JWT:        'narrativeOS_jwt',
  USER_ID:    'narrativeOS_user_id',
  AGENT_ID:   'narrativeOS_agent_id',
  AUTO_REPLY: 'narrativeOS_auto_reply_enabled',
  API_BASE:   'narrativeOS_api_base',
};

async function getAPIBase() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.API_BASE);
  const stored = (result[STORAGE_KEYS.API_BASE] || '').trim().replace(/\/+$/, '');
  if (!stored) return DEFAULT_API_BASE;
  return stored.endsWith('/api') ? stored : `${stored}/api`;
}

function normalizeAPIBase(url) {
  const cleaned = (url || '').trim().replace(/\/+$/, '');
  if (!cleaned) return DEFAULT_API_BASE;
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
}

// Initialize extension on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({ [STORAGE_KEYS.API_BASE]: DEFAULT_API_BASE });
    chrome.runtime.openOptionsPage();
  }
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateDraft') {
    generateDraft(request.data).then(sendResponse);
    return true;
  }
  if (request.action === 'getAPIBase') {
    getAPIBase().then(url => sendResponse({ url }));
    return true;
  }
  if (request.action === 'agentGenerate') {
    agentGenerate(request.data).then(sendResponse);
    return true;
  }
});

async function getJWT() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.JWT);
  return result[STORAGE_KEYS.JWT];
}

async function generateDraft(data) {
  try {
    const API_BASE = await getAPIBase();
    const jwt = await getJWT();
    if (!jwt) return { success: false, error: 'Not authenticated' };

    const response = await fetch(`${API_BASE}/extension/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function agentGenerate(data) {
  try {
    const API_BASE = await getAPIBase();
    const jwt = await getJWT();
    if (!jwt) return { success: false, error: 'Not authenticated' };

    const response = await fetch(`${API_BASE}/agent/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Periodic stat reset alarm (every hour)
chrome.alarms.create('nosHourlyReset', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'nosHourlyReset') {
    await chrome.storage.local.set({ narrativeOS_stat_replies: 0 });
  }
});
