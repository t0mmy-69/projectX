// NarrativeOS Extension - Content Script
// Runs on X/Twitter pages
// Handles: DOM scraping, draft injection, auto-reply execution

const COMPOSER_SELECTOR = '[data-testid="tweetTextarea"]';
const REPLY_BUTTON_SELECTOR = '[data-testid="tweetButton"]';
const POST_CONTENT_SELECTOR = '[data-testid="tweet"]';

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeExtension);

function initializeExtension() {
  console.log('NarrativeOS Extension initialized on X');

  // Add UI buttons to posts
  setupPostUIButtons();

  // Monitor for new posts
  setupMutationObserver();

  // Setup composer enhancement
  setupComposerEnhancement();
}

function setupPostUIButtons() {
  document.addEventListener('click', (e) => {
    const draftBtn = e.target.closest('[data-narrative-draft-btn]');
    const replyBtn = e.target.closest('[data-narrative-reply-btn]');

    if (draftBtn) {
      handleGenerateDraftClick(draftBtn);
    }

    if (replyBtn) {
      handleAutoReplyClick(replyBtn);
    }
  });
}

function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Check for new posts and add buttons
        const newPosts = mutation.target.querySelectorAll(POST_CONTENT_SELECTOR);
        newPosts.forEach(post => {
          if (!post.hasAttribute('data-narrative-processed')) {
            enhancePost(post);
            post.setAttribute('data-narrative-processed', 'true');
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });
}

function enhancePost(postElement) {
  // Extract post data
  const postData = extractPostData(postElement);
  if (!postData) return;

  // Add draft button
  const actionBar = postElement.querySelector('[data-testid="tweet"] [role="group"]');
  if (actionBar) {
    const draftBtn = createButton('Generate Draft', 'generate_draft');
    draftBtn.setAttribute('data-narrative-draft-btn', 'true');
    draftBtn.setAttribute('data-post-id', postData.postId);
    actionBar.appendChild(draftBtn);
  }
}

function extractPostData(postElement) {
  try {
    const content = postElement.querySelector('[data-testid="tweetText"]')?.innerText || '';
    const author = postElement.querySelector('[data-testid="User-Name"]')?.innerText || '';
    const likesEl = postElement.querySelector('[data-testid="like"]')?.getAttribute('aria-label');
    const likes = parseInt(likesEl?.match(/\d+/)?.[0] || 0);

    return {
      postId: postElement.getAttribute('data-testid') || `post_${Date.now()}`,
      content,
      author,
      likes
    };
  } catch (error) {
    console.error('Error extracting post data:', error);
    return null;
  }
}

function handleGenerateDraftClick(button) {
  const postId = button.getAttribute('data-post-id');

  // Show loading state
  button.disabled = true;
  button.textContent = 'Generating...';

  // Send message to background script
  chrome.runtime.sendMessage(
    {
      action: 'generateDraft',
      data: {
        topic_id: localStorage.getItem('selected_topic_id'),
        post_id: postId,
        summary: 'Generated from post context'
      }
    },
    (response) => {
      button.disabled = false;
      if (response.success) {
        // Show draft options
        showDraftModal(response.data);
      } else {
        alert('Failed to generate draft: ' + (response.error || 'Unknown error'));
      }
    }
  );
}

function handleAutoReplyClick(button) {
  const postId = button.getAttribute('data-post-id');

  chrome.runtime.sendMessage(
    {
      action: 'checkAutoReply',
      data: {
        post_id: postId,
        proposed_reply: 'Auto-reply enabled'
      }
    },
    (response) => {
      if (response.success && response.data.is_safe) {
        // Execute auto-reply
        executeAutoReply(postId);
      } else {
        alert('Auto-reply blocked: ' + (response.data?.recommendation || 'Safety check failed'));
      }
    }
  );
}

function showDraftModal(draft) {
  const modal = document.createElement('div');
  modal.className = 'narrative-draft-modal';
  modal.innerHTML = `
    <div class="narrative-modal-content">
      <h3>Generated Draft Options</h3>
      <div class="hooks">
        <p><strong>Hook 1:</strong> ${draft.hook_variation_1}</p>
        <p><strong>Hook 2:</strong> ${draft.hook_variation_2}</p>
        <p><strong>Hook 3:</strong> ${draft.hook_variation_3}</p>
      </div>
      <div class="draft">
        <p><strong>Draft:</strong></p>
        <p>${draft.tweet_draft}</p>
      </div>
      <div class="actions">
        <button id="inject-draft">Inject Draft</button>
        <button id="close-modal">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('inject-draft').onclick = () => {
    injectDraftToComposer(draft.tweet_draft);
    modal.remove();
  };

  document.getElementById('close-modal').onclick = () => modal.remove();
}

function injectDraftToComposer(draftText) {
  const composer = document.querySelector(COMPOSER_SELECTOR);
  if (composer) {
    // Focus and set text
    composer.focus();
    composer.textContent = draftText;

    // Trigger input event for React state update
    const inputEvent = new Event('input', { bubbles: true });
    composer.dispatchEvent(inputEvent);

    // Show notification
    alert('Draft injected! Ready to post.');
  } else {
    alert('Could not find composer');
  }
}

function executeAutoReply(postId) {
  // Implementation for auto-reply
  // This would involve clicking reply, injecting text, and posting
  console.log('Auto-reply would be executed for post:', postId);
}

function createButton(label, action) {
  const btn = document.createElement('button');
  btn.className = 'narrative-btn';
  btn.textContent = label;
  btn.style.cssText = `
    padding: 6px 12px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 12px;
    cursor: pointer;
    margin-left: 4px;
  `;
  return btn;
}

// Styles
const style = document.createElement('style');
style.textContent = `
  .narrative-draft-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }

  .narrative-modal-content {
    background: white;
    padding: 24px;
    border-radius: 12px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .narrative-modal-content h3 {
    margin: 0 0 16px 0;
    font-size: 18px;
  }

  .narrative-modal-content p {
    margin: 8px 0;
  }

  .narrative-modal-content .actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }

  .narrative-modal-content button {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }

  #inject-draft {
    background: #3b82f6;
    color: white;
  }

  #close-modal {
    background: #e5e7eb;
    color: #1f2937;
  }
`;
document.head.appendChild(style);
