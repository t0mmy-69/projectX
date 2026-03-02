// NarrativeOS Extension Content Script
// Injected into X (twitter.com) pages

const API_BASE_DEFAULT = 'http://localhost:3001/api';

async function getStoredValue(key) {
  return new Promise(resolve => {
    chrome.storage.local.get(key, result => resolve(result[key]));
  });
}

async function getAPIBase() {
  const base = await getStoredValue('narrativeOS_api_base');
  return base || API_BASE_DEFAULT;
}

async function getAuth() {
  const token = await getStoredValue('narrativeOS_extension_token');
  const userId = await getStoredValue('narrativeOS_user_id');
  return { token, userId };
}

// Inject NarrativeOS draft button into X composer
function injectDraftButton(composer) {
  if (composer.querySelector('.nos-draft-btn')) return;

  const btn = document.createElement('button');
  btn.className = 'nos-draft-btn';
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
    <span>AI Draft</span>
  `;
  btn.style.cssText = `
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px; background: #814ac8; color: white;
    border: none; border-radius: 20px; font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all 0.2s; margin-left: 8px;
    box-shadow: 0 0 12px rgba(129,74,200,0.3);
  `;
  btn.addEventListener('mouseenter', () => { btn.style.background = '#9b6cd8'; });
  btn.addEventListener('mouseleave', () => { btn.style.background = '#814ac8'; });
  btn.addEventListener('click', handleDraftRequest);

  const toolbar = composer.querySelector('[data-testid="toolBar"]') ||
                  composer.querySelector('.DraftEditor-root')?.parentElement?.parentElement;
  if (toolbar) {
    toolbar.appendChild(btn);
  }
}

// Get tweet context from DOM
function getTweetContext() {
  // Try to get reply context (the tweet being replied to)
  const replyTarget = document.querySelector('[data-testid="tweet"] [data-testid="tweetText"]');
  if (replyTarget) {
    return replyTarget.textContent?.trim() || '';
  }
  return '';
}

// Get current composer text
function getComposerText() {
  const editor = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                 document.querySelector('.public-DraftEditor-content');
  return editor?.textContent?.trim() || '';
}

// Set composer text
function setComposerText(text) {
  const editor = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                 document.querySelector('[contenteditable="true"]');
  if (!editor) return false;
  
  // Focus the editor
  editor.focus();
  
  // Use execCommand to set text (works better with React)
  document.execCommand('selectAll', false, null);
  document.execCommand('insertText', false, text);
  
  return true;
}

async function handleDraftRequest() {
  const { token, userId } = await getAuth();
  if (!token || !userId) {
    showNOSNotification('Please connect NarrativeOS extension first', 'error');
    return;
  }

  // Check for pending draft from dashboard
  const pendingDraft = localStorage.getItem('narrativeOS_pending_draft');
  if (pendingDraft) {
    setComposerText(pendingDraft);
    localStorage.removeItem('narrativeOS_pending_draft');
    showNOSNotification('Draft loaded from NarrativeOS! ✦', 'success');
    return;
  }

  const tweetContext = getTweetContext();
  showNOSNotification('Generating AI draft...', 'info');

  try {
    const API_BASE = await getAPIBase();
    const res = await fetch(`${API_BASE}/extension/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-extension-token': token,
        'x-user-id': userId,
      },
      body: JSON.stringify({
        context: tweetContext,
        topic_id: 'current',
        existing_text: getComposerText(),
      }),
    });
    
    const data = await res.json();
    if (data.success && data.data?.draft) {
      setComposerText(data.data.draft);
      showNOSNotification('AI draft ready! ✦', 'success');
    } else {
      // Fallback: show quick suggestion
      showNOSNotification('Draft ready in Dashboard → Draft Studio', 'info');
    }
  } catch {
    showNOSNotification('Could not reach NarrativeOS. Check settings.', 'error');
  }
}

// Scan timeline for viral posts and add reply buttons
async function scanTimeline() {
  const autoReplyEnabled = await getStoredValue('narrativeOS_auto_reply_enabled');
  if (!autoReplyEnabled || autoReplyEnabled !== 'true') return;

  const tweets = document.querySelectorAll('[data-testid="tweet"]:not([data-nos-scanned])');
  tweets.forEach(tweet => {
    tweet.setAttribute('data-nos-scanned', 'true');
    addAutoReplyButton(tweet);
  });
}

function addAutoReplyButton(tweet) {
  if (tweet.querySelector('.nos-auto-reply-btn')) return;

  const actionBar = tweet.querySelector('[role="group"]');
  if (!actionBar) return;

  const btn = document.createElement('button');
  btn.className = 'nos-auto-reply-btn';
  btn.innerHTML = '✦';
  btn.title = 'NarrativeOS: AI Auto-Reply';
  btn.style.cssText = `
    background: transparent; border: none; cursor: pointer;
    color: #814ac8; font-size: 16px; padding: 4px 8px;
    opacity: 0.7; transition: all 0.2s; border-radius: 50%;
  `;
  btn.addEventListener('mouseenter', () => { btn.style.opacity = '1'; btn.style.background = 'rgba(129,74,200,0.1)'; });
  btn.addEventListener('mouseleave', () => { btn.style.opacity = '0.7'; btn.style.background = 'transparent'; });
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleAutoReply(tweet, btn);
  });

  actionBar.appendChild(btn);
}

async function handleAutoReply(tweet, btn) {
  const { token, userId } = await getAuth();
  if (!token || !userId) {
    showNOSNotification('Connect extension first', 'error');
    return;
  }

  const tweetText = tweet.querySelector('[data-testid="tweetText"]')?.textContent?.trim() || '';
  const tweetAuthor = tweet.querySelector('[data-testid="User-Name"]')?.textContent?.trim() || '';
  
  if (!tweetText) return;

  btn.innerHTML = '⏳';
  btn.disabled = true;

  try {
    const API_BASE = await getAPIBase();
    const res = await fetch(`${API_BASE}/extension/auto-reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-extension-token': token,
        'x-user-id': userId,
      },
      body: JSON.stringify({ tweet_text: tweetText, tweet_author: tweetAuthor }),
    });
    
    const data = await res.json();
    btn.innerHTML = '✦';
    btn.disabled = false;

    if (data.success && data.data?.reply) {
      showReplyPreview(tweet, data.data.reply);
    } else {
      showNOSNotification('Could not generate reply', 'error');
    }
  } catch {
    btn.innerHTML = '✦';
    btn.disabled = false;
    showNOSNotification('Error generating reply', 'error');
  }
}

function showReplyPreview(tweet, replyText) {
  // Remove existing preview
  document.querySelector('.nos-reply-preview')?.remove();

  const preview = document.createElement('div');
  preview.className = 'nos-reply-preview';
  preview.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 99999;
    background: #0A0A0B; border: 1px solid rgba(129,74,200,0.4);
    border-radius: 16px; padding: 20px; max-width: 380px; width: 100%;
    box-shadow: 0 0 40px rgba(129,74,200,0.2); font-family: -apple-system, sans-serif;
  `;
  preview.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <span style="font-size:12px;font-weight:800;color:#814ac8;text-transform:uppercase;letter-spacing:0.1em;">✦ AI Reply Draft</span>
      <button onclick="this.closest('.nos-reply-preview').remove()" style="background:none;border:none;color:#666;cursor:pointer;font-size:18px;padding:0;line-height:1;">×</button>
    </div>
    <p style="font-size:14px;color:#e5e5e5;line-height:1.6;margin:0 0 16px;">${replyText.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
    <div style="display:flex;gap:8px;">
      <button class="nos-copy-reply" style="flex:1;padding:10px;background:#814ac8;color:white;border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;">Copy Reply</button>
      <button class="nos-dismiss-reply" style="flex:1;padding:10px;background:rgba(255,255,255,0.05);color:#aaa;border:1px solid rgba(255,255,255,0.05);border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;">Dismiss</button>
    </div>
  `;
  
  preview.querySelector('.nos-copy-reply').addEventListener('click', () => {
    navigator.clipboard.writeText(replyText);
    preview.querySelector('.nos-copy-reply').textContent = 'Copied!';
    setTimeout(() => preview.remove(), 1500);
  });
  preview.querySelector('.nos-dismiss-reply').addEventListener('click', () => preview.remove());
  
  document.body.appendChild(preview);
}

function showNOSNotification(message, type = 'info') {
  document.querySelector('.nos-notification')?.remove();

  const colors = { info: '#814ac8', success: '#22c55e', error: '#ef4444' };
  const notif = document.createElement('div');
  notif.className = 'nos-notification';
  notif.style.cssText = `
    position: fixed; top: 80px; right: 24px; z-index: 99999;
    background: #0A0A0B; border: 1px solid ${colors[type]}40;
    border-left: 3px solid ${colors[type]};
    border-radius: 10px; padding: 12px 16px;
    font-family: -apple-system, sans-serif; font-size: 13px; font-weight: 600;
    color: #e5e5e5; max-width: 300px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    animation: nosSlideIn 0.2s ease-out;
  `;
  notif.textContent = `✦ ${message}`;
  document.body.appendChild(notif);
  setTimeout(() => notif.style.opacity = '0', 2500);
  setTimeout(() => notif.remove(), 2800);
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `@keyframes nosSlideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }`;
document.head.appendChild(style);

// Observer to inject buttons as X dynamically loads content
const observer = new MutationObserver(() => {
  // Inject draft buttons into composers
  document.querySelectorAll('[data-testid="tweetTextarea_0_label"], .DraftEditor-root').forEach(el => {
    const composer = el.closest('[data-testid="tweetButtonInline"]')?.parentElement ||
                     el.closest('div[role="dialog"]') ||
                     el.parentElement?.parentElement?.parentElement;
    if (composer) injectDraftButton(composer);
  });
  
  // Scan timeline for viral posts
  scanTimeline();
});

observer.observe(document.body, { childList: true, subtree: true });

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'injectDraft' && request.data?.draft) {
    setComposerText(request.data.draft);
    showNOSNotification('Draft injected! ✦', 'success');
    sendResponse({ success: true });
  }
  if (request.action === 'ping') {
    sendResponse({ active: true, url: window.location.href });
  }
  return true;
});

console.log('[NarrativeOS] Content script loaded ✦');
