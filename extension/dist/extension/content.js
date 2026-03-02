// NarrativeOS Extension Content Script v2.0
// Full DOM auto-scan: watches X newsfeed, detects posts matching agent topics,
// generates AI replies, shows preview or auto-posts

// ─── State ───────────────────────────────────────────────────────────────────

const NOS_STATE = {
  jwt:         null,
  agentId:     null,
  agentTopics: [],
  autoReply:   false,
  autoMode:    false,
  processing:  new Set(),    // post IDs currently being processed
  repliesHour: 0,
  scanned:     0,
  hourReset:   Date.now(),
};

const NOS_KEYS = {
  JWT:        'narrativeOS_jwt',
  AGENT_ID:   'narrativeOS_agent_id',
  AUTO_REPLY: 'narrativeOS_auto_reply_enabled',
  STAT_R:     'narrativeOS_stat_replies',
  STAT_S:     'narrativeOS_stat_scanned',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nosGetStored(key) {
  return new Promise(resolve => chrome.storage.local.get(key, r => resolve(r[key])));
}

async function nosGetAPIBase() {
  const base = await nosGetStored('narrativeOS_api_base');
  const cleaned = (base || 'https://project-x-lilac.vercel.app/api').trim().replace(/\/+$/, '');
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
}

async function nosAuthHeaders() {
  if (!NOS_STATE.jwt) NOS_STATE.jwt = await nosGetStored(NOS_KEYS.JWT);
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${NOS_STATE.jwt}`,
  };
}

async function nosSaveStats() {
  await chrome.storage.local.set({
    [NOS_KEYS.STAT_R]: NOS_STATE.repliesHour,
    [NOS_KEYS.STAT_S]: NOS_STATE.scanned,
  });
}

function nosSleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function nosWaitForElement(selector, timeout) {
  return new Promise(resolve => {
    const existing = document.querySelector(selector);
    if (existing) { resolve(existing); return; }
    const obs = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) { obs.disconnect(); resolve(el); }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { obs.disconnect(); resolve(null); }, timeout || 3000);
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function nosBoot() {
  NOS_STATE.jwt       = await nosGetStored(NOS_KEYS.JWT);
  NOS_STATE.agentId   = await nosGetStored(NOS_KEYS.AGENT_ID);
  NOS_STATE.autoReply = (await nosGetStored(NOS_KEYS.AUTO_REPLY)) === 'true';

  if (NOS_STATE.jwt && NOS_STATE.agentId && NOS_STATE.autoReply) {
    await nosFetchAgentDetails();
    nosStartObserver();
  }
  nosInjectDraftButtons();
  console.log('[NarrativeOS] v2.0 loaded ✦ autoReply:', NOS_STATE.autoReply);
}

// ─── Fetch agent details from API ────────────────────────────────────────────

async function nosFetchAgentDetails() {
  if (!NOS_STATE.jwt || !NOS_STATE.agentId) return;
  try {
    const API_BASE = await nosGetAPIBase();
    const res = await fetch(`${API_BASE}/agents/${NOS_STATE.agentId}`, {
      headers: { 'Authorization': `Bearer ${NOS_STATE.jwt}` },
    });
    const data = await res.json();
    if (data.success) {
      NOS_STATE.agentTopics = data.data.topics || [];
      NOS_STATE.autoMode    = data.data.auto_mode || false;
      console.log('[NarrativeOS] Agent:', data.data.name, '| topics:', NOS_STATE.agentTopics, '| auto_mode:', NOS_STATE.autoMode);
    }
  } catch {}
}

// ─── Topic Matching ───────────────────────────────────────────────────────────

function nosPostMatchesTopics(text) {
  if (!NOS_STATE.agentTopics.length) return true; // no topic filter = match everything
  const lower = text.toLowerCase();
  return NOS_STATE.agentTopics.some(t => lower.includes(t.toLowerCase()));
}

// ─── DOM Post Extraction ──────────────────────────────────────────────────────

function nosExtractTweetData(article) {
  const textEl   = article.querySelector('[data-testid="tweetText"]');
  const authorEl = article.querySelector('[data-testid="User-Name"]');
  const linkEl   = article.querySelector('a[href*="/status/"]');

  const text   = textEl?.innerText?.trim() || '';
  const author = authorEl?.querySelector('span')?.textContent?.trim() || '';
  const url    = linkEl ? 'https://x.com' + linkEl.getAttribute('href') : '';
  const postId = linkEl?.getAttribute('href')?.split('/status/')?.[1] || ('nos_' + Date.now() + '_' + Math.random().toString(36).slice(2));

  return { text, author, url, postId };
}

// ─── MutationObserver ─────────────────────────────────────────────────────────

let nosObserver = null;

function nosStartObserver() {
  if (nosObserver) nosObserver.disconnect();
  nosObserver = new MutationObserver(() => {
    if (!NOS_STATE.autoReply || !NOS_STATE.agentId) return;
    nosScanFeed();
  });
  nosObserver.observe(document.body, { childList: true, subtree: true });
  console.log('[NarrativeOS] Observer started');
  setTimeout(nosScanFeed, 1500);
}

function nosStopObserver() {
  if (nosObserver) { nosObserver.disconnect(); nosObserver = null; }
}

// ─── Feed Scanner ─────────────────────────────────────────────────────────────

function nosScanFeed() {
  // Hourly rate limit reset
  if (Date.now() - NOS_STATE.hourReset > 60 * 60 * 1000) {
    NOS_STATE.repliesHour = 0;
    NOS_STATE.hourReset   = Date.now();
  }

  const articles = document.querySelectorAll('article[data-testid="tweet"]:not([data-nos-scanned])');
  articles.forEach(article => {
    const { text, author, url, postId } = nosExtractTweetData(article);
    if (!text || text.length < 20) return;

    article.setAttribute('data-nos-scanned', postId);
    NOS_STATE.scanned++;
    nosSaveStats();

    if (!nosPostMatchesTopics(text)) return;

    // Add NOS reply button
    nosAddReplyBtn(article, postId);

    // Auto-mode: trigger generation immediately
    if (NOS_STATE.autoMode && NOS_STATE.repliesHour < 20) {
      nosProcessPost(article, postId, text, author, url, true);
    }
  });
}

// ─── NOS Reply Button ─────────────────────────────────────────────────────────

function nosAddReplyBtn(article, postId) {
  if (article.querySelector('.nos-reply-btn')) return;
  const actionBar = article.querySelector('[role="group"]');
  if (!actionBar) return;

  const btn = document.createElement('button');
  btn.className = 'nos-reply-btn';
  btn.setAttribute('data-nos-post-id', postId);
  btn.innerHTML = '✦';
  btn.title = 'NarrativeOS: AI Reply';
  btn.style.cssText = `
    display: inline-flex; align-items: center; justify-content: center;
    width: 32px; height: 32px;
    background: rgba(129,74,200,0.1); border: 1px solid rgba(129,74,200,0.2);
    border-radius: 50%; color: #9b6cd8; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all 0.2s; font-family: inherit; margin-left: 4px;
    flex-shrink: 0;
  `;
  btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(129,74,200,0.22)'; btn.style.color = '#c4a0f0'; });
  btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(129,74,200,0.1)'; btn.style.color = '#9b6cd8'; });
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const { text, author, url } = nosExtractTweetData(article);
    nosProcessPost(article, postId, text, author, url, false);
  });
  actionBar.appendChild(btn);
}

// ─── Process Post ─────────────────────────────────────────────────────────────

async function nosProcessPost(article, postId, text, author, url, isAutoMode) {
  if (NOS_STATE.processing.has(postId)) return;
  NOS_STATE.processing.add(postId);

  const btn = article.querySelector(`.nos-reply-btn[data-nos-post-id="${postId}"]`);
  if (btn) { btn.innerHTML = '⏳'; btn.disabled = true; btn.style.cursor = 'wait'; }

  try {
    const API_BASE = await nosGetAPIBase();
    const headers  = await nosAuthHeaders();

    const res = await fetch(`${API_BASE}/agent/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        agent_id:    NOS_STATE.agentId,
        post_text:   text,
        post_author: author,
        post_url:    url,
      }),
    });

    const data = await res.json();

    if (btn) { btn.innerHTML = '✦'; btn.disabled = false; btn.style.cursor = 'pointer'; }

    if (data.success && data.data && data.data.reply) {
      const reply = data.data.reply;
      NOS_STATE.repliesHour++;
      await nosSaveStats();

      if (isAutoMode && NOS_STATE.autoMode) {
        await nosAutoPost(article, reply, data.data.decision_id);
      } else {
        nosShowPreview(article, reply, data.data, postId);
      }
    } else if (data.error) {
      if (data.error.includes('limit')) nosShowNotification('Hourly limit reached', 'error');
    }
  } catch {
    if (btn) { btn.innerHTML = '✦'; btn.disabled = false; btn.style.cursor = 'pointer'; }
  } finally {
    NOS_STATE.processing.delete(postId);
  }
}

// ─── Auto-Post via DOM ────────────────────────────────────────────────────────

async function nosAutoPost(article, replyText, decisionId) {
  try {
    // Click native reply button
    const replyBtn = article.querySelector('[data-testid="reply"]');
    if (!replyBtn) { nosShowNotification('Reply button not found', 'error'); return; }

    replyBtn.click();
    await nosSleep(900);

    // Wait for composer
    const editor = await nosWaitForElement('[data-testid="tweetTextarea_0"]', 3500);
    if (!editor) { nosShowNotification('Composer not found', 'error'); return; }

    editor.focus();
    await nosSleep(150);
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, replyText);
    await nosSleep(400);

    // Click submit
    const submitBtn = document.querySelector('[data-testid="tweetButtonInline"]');
    if (submitBtn && !submitBtn.disabled) {
      submitBtn.click();
      nosShowNotification('Auto-replied ✦', 'success');
    }
  } catch (err) {
    nosShowNotification('Auto-post failed', 'error');
  }
}

// ─── Reply Preview Overlay ────────────────────────────────────────────────────

function nosShowPreview(article, replyText, meta, postId) {
  document.querySelector('.nos-preview-overlay')?.remove();

  const safe = replyText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const aiLabel = meta.used_ai
    ? `${meta.model} · ${meta.tokens_used} tokens`
    : 'Template (add API key in Settings)';

  const overlay = document.createElement('div');
  overlay.className = 'nos-preview-overlay';
  overlay.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 99999;
    background: #0a0a0b; border: 1px solid rgba(129,74,200,0.3);
    border-radius: 16px; padding: 18px; max-width: 380px; width: 100%;
    box-shadow: 0 8px 40px rgba(0,0,0,0.7);
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
    animation: nosSlideIn 0.2s ease-out;
  `;

  overlay.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <span style="font-size:11px;font-weight:800;color:#814ac8;text-transform:uppercase;letter-spacing:0.1em;">
        ✦ ${meta.agent_name || 'AI'} Draft Reply
      </span>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:9px;color:#333;font-weight:600;">${aiLabel}</span>
        <button id="nos-close" style="background:none;border:none;color:#444;cursor:pointer;font-size:20px;padding:0;line-height:1;font-family:inherit;">×</button>
      </div>
    </div>
    <p style="font-size:14px;color:#e5e5e5;line-height:1.65;margin:0 0 14px;">${safe}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
      <button id="nos-copy" style="padding:9px;background:#814ac8;color:white;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Copy</button>
      <button id="nos-post" style="padding:9px;background:rgba(34,197,94,0.12);color:#4ade80;border:1px solid rgba(34,197,94,0.2);border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Post Reply</button>
    </div>
    <button id="nos-regen" style="width:100%;background:none;border:1px solid rgba(255,255,255,0.05);color:#555;cursor:pointer;font-size:11px;padding:7px;border-radius:8px;font-family:inherit;">↺ Regenerate</button>
  `;

  overlay.querySelector('#nos-close').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#nos-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(replyText);
    overlay.querySelector('#nos-copy').textContent = 'Copied!';
    setTimeout(() => overlay.remove(), 1500);
  });
  overlay.querySelector('#nos-post').addEventListener('click', async () => {
    overlay.remove();
    await nosAutoPost(article, replyText, null);
  });
  overlay.querySelector('#nos-regen').addEventListener('click', async () => {
    overlay.remove();
    article.removeAttribute('data-nos-scanned');
    const { text, author, url } = nosExtractTweetData(article);
    await nosProcessPost(article, postId, text, author, url, false);
  });

  document.body.appendChild(overlay);
}

// ─── Draft Buttons in Composer ────────────────────────────────────────────────

function nosInjectDraftButtons() {
  const mutObs = new MutationObserver(() => {
    document.querySelectorAll('[data-testid="tweetTextarea_0"]').forEach(el => {
      const composer = el.closest('[role="dialog"]') || el.parentElement?.parentElement?.parentElement;
      if (composer) nosInjectDraftBtn(composer);
    });
  });
  mutObs.observe(document.body, { childList: true, subtree: true });
}

function nosInjectDraftBtn(composer) {
  if (composer.querySelector('.nos-draft-btn')) return;
  const toolbar = composer.querySelector('[data-testid="toolBar"]') ||
                  composer.querySelector('[role="toolbar"]');
  if (!toolbar) return;

  const btn = document.createElement('button');
  btn.className = 'nos-draft-btn';
  btn.innerHTML = '✦ AI Draft';
  btn.style.cssText = `
    display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px;
    background: #814ac8; color: white; border: none; border-radius: 18px;
    font-size: 12px; font-weight: 700; cursor: pointer; margin-left: 8px;
    transition: background 0.2s; font-family: inherit;
    box-shadow: 0 0 10px rgba(129,74,200,0.3);
  `;
  btn.addEventListener('mouseenter', () => { btn.style.background = '#9b6cd8'; });
  btn.addEventListener('mouseleave', () => { btn.style.background = '#814ac8'; });
  btn.addEventListener('click', nosHandleDraft);
  toolbar.appendChild(btn);
}

async function nosHandleDraft() {
  const jwt = NOS_STATE.jwt || await nosGetStored(NOS_KEYS.JWT);
  if (!jwt) { nosShowNotification('Sign in to NarrativeOS extension first', 'error'); return; }

  const pending = localStorage.getItem('narrativeOS_pending_draft');
  if (pending) {
    nosSetComposerText(pending);
    localStorage.removeItem('narrativeOS_pending_draft');
    nosShowNotification('Draft loaded! ✦', 'success');
    return;
  }

  const context = document.querySelector('[data-testid="tweet"] [data-testid="tweetText"]')?.textContent?.trim() || '';
  nosShowNotification('Generating draft...', 'info');

  try {
    const API_BASE = await nosGetAPIBase();
    const agentId  = await nosGetStored(NOS_KEYS.AGENT_ID);
    const endpoint = agentId ? `${API_BASE}/agent/generate` : `${API_BASE}/extension/draft`;
    const body     = agentId
      ? { agent_id: agentId, post_text: context || 'Write a viral tweet', post_author: '' }
      : { context, topic_id: 'current' };

    const res  = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const draft = data.data?.reply || data.data?.draft;

    if (data.success && draft) {
      nosSetComposerText(draft);
      nosShowNotification('Draft ready! ✦', 'success');
    } else {
      nosShowNotification('Tip: Open NarrativeOS → Draft Studio', 'info');
    }
  } catch {
    nosShowNotification('Connection error. Check settings.', 'error');
  }
}

function nosSetComposerText(text) {
  const editor = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                 document.querySelector('[contenteditable="true"]');
  if (!editor) return;
  editor.focus();
  document.execCommand('selectAll', false, null);
  document.execCommand('insertText', false, text);
}

// ─── Notifications ────────────────────────────────────────────────────────────

function nosShowNotification(message, type) {
  document.querySelector('.nos-notification')?.remove();
  const colors = { info: '#814ac8', success: '#22c55e', error: '#ef4444' };
  const color  = colors[type] || colors.info;
  const notif  = document.createElement('div');
  notif.className = 'nos-notification';
  notif.style.cssText = `
    position: fixed; top: 80px; right: 20px; z-index: 99999;
    background: #0a0a0b; border: 1px solid ${color}35;
    border-left: 3px solid ${color};
    border-radius: 10px; padding: 11px 14px;
    font-family: -apple-system, sans-serif; font-size: 13px; font-weight: 600;
    color: #e5e5e5; max-width: 300px; line-height: 1.4;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    animation: nosSlideIn 0.2s ease-out; transition: opacity 0.3s;
  `;
  notif.textContent = '✦ ' + message;
  document.body.appendChild(notif);
  setTimeout(() => { notif.style.opacity = '0'; }, 2700);
  setTimeout(() => notif.remove(), 3000);
}

// ─── CSS Animations ───────────────────────────────────────────────────────────

const nosStyle = document.createElement('style');
nosStyle.textContent = `
  @keyframes nosSlideIn {
    from { opacity: 0; transform: translateX(16px); }
    to   { opacity: 1; transform: translateX(0); }
  }
`;
document.head.appendChild(nosStyle);

// ─── Message Handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setAutoReply') {
    NOS_STATE.autoReply = request.enabled;
    if (request.agentId) NOS_STATE.agentId = request.agentId;
    if (request.jwt)     NOS_STATE.jwt     = request.jwt;

    if (NOS_STATE.autoReply && NOS_STATE.agentId) {
      nosFetchAgentDetails().then(() => nosStartObserver());
    } else {
      nosStopObserver();
    }
    sendResponse({ success: true });
  }

  if (request.action === 'setAgent') {
    NOS_STATE.agentId = request.agentId;
    nosFetchAgentDetails();
    sendResponse({ success: true });
  }

  if (request.action === 'injectDraft' && request.data && request.data.draft) {
    nosSetComposerText(request.data.draft);
    nosShowNotification('Draft injected! ✦', 'success');
    sendResponse({ success: true });
  }

  if (request.action === 'ping') {
    sendResponse({ active: true, autoReply: NOS_STATE.autoReply, agentId: NOS_STATE.agentId });
  }

  return true;
});

// ─── Init ─────────────────────────────────────────────────────────────────────

nosBoot();
