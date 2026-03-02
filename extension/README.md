# NarrativeOS Chrome Extension

The NarrativeOS Chrome Extension is the execution layer that connects your X (Twitter) browser to the NarrativeOS backend. It enables real-time draft generation, auto-reply, and post analysis directly on X.

## Features

- **Draft Generation**: Generate AI-powered drafts for any post you see on X
- **Auto-Reply**: Automatically reply to posts matching your criteria with smart safety checks
- **Post Enhancement**: Add NarrativeOS buttons to every post for quick actions
- **Token Authentication**: Secure token-based authentication with the backend

## Installation

### For Users (Manual Installation)

1. Save the extension folder locally
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your Chrome toolbar

### For Development

```bash
# From the extension folder, you can modify files directly
# Changes take effect after reloading the extension on chrome://extensions/
```

## Setup

### 1. Generate Extension Token

1. Go to your NarrativeOS Dashboard Settings
2. Click "Generate Extension Token"
3. Copy the token provided

### 2. Connect Extension

1. Click the NarrativeOS extension icon in Chrome
2. Paste your token in the "Extension Token" field
3. Click "Connect"
4. You should see "Connected as [user_id]"

## Usage

### Generate Draft

1. Navigate to X (twitter.com or x.com)
2. Find any post you want to respond to
3. Click the blue "Generate Draft" button that appears on the post
4. Review the hook variations and draft
5. Click "Inject Draft" to add it to your composer
6. Post as normal

### Enable Auto-Reply

1. Open the extension popup
2. Toggle "Enable Auto-Reply"
3. Go to Dashboard → Settings → Auto-Reply to configure rules
4. The extension will automatically reply to matching posts

### Auto-Reply Safety Features

- **Rate Limiting**: Max 10 replies per hour
- **Cooldown**: 5-minute minimum between replies
- **Spam Detection**: Blocks suspicious patterns
- **Manual Confirmation**: Requires your approval by default
- **Similarity Check**: Prevents duplicate replies

## Architecture

```
┌─────────────────────────────────────────┐
│      X.com / Twitter.com (Browser)      │
├─────────────────────────────────────────┤
│    Content Script (content.js)           │
│    - Injects UI buttons on posts         │
│    - Extracts post data                  │
│    - Handles user interactions           │
├─────────────────────────────────────────┤
│  Background Service Worker (background.js)
│    - Manages tokens & authentication     │
│    - Communicates with backend API       │
│    - Handles auto-reply execution        │
├─────────────────────────────────────────┤
│   Popup UI (popup.html / popup.js)       │
│    - Token management                    │
│    - Settings access                     │
│    - Status display                      │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│   NarrativeOS Backend API                │
│   (http://localhost:3000/api)            │
├─────────────────────────────────────────┤
│   - /api/extension/token (token mgmt)    │
│   - /api/drafts (draft generation)       │
│   - /api/auto-reply (auto-reply logic)   │
│   - /api/posts (post analysis)           │
└─────────────────────────────────────────┘
```

## Files

- **manifest.json**: Extension configuration and permissions
- **background.js**: Service worker that handles API communication
- **content.js**: Scripts that run on X pages for UI injection
- **popup.html/popup.js**: Extension popup UI
- **styles.css**: Styling for injected elements
- **README.md**: This file

## API Endpoints Used

### Token Management
- `POST /api/extension/token` - Generate new token
- `PUT /api/extension/validate` - Validate token
- `DELETE /api/extension/token` - Revoke token

### Draft Generation
- `POST /api/drafts` - Generate new draft
- `GET /api/drafts` - List user's drafts

### Auto-Reply
- `GET /api/auto-reply` - Get auto-reply rules
- `POST /api/auto-reply` - Create auto-reply rule
- `PUT /api/auto-reply` - Validate and execute reply

### Posts
- `GET /api/posts` - Get viral feed
- `POST /api/posts` - Add manual post

## Configuration

### Required Permissions

- `activeTab` - Access current tab
- `scripting` - Run scripts on X pages
- `webRequest` - Monitor network requests
- `storage` - Store token and settings
- Host permissions for `twitter.com/*` and `x.com/*`

### Environment Variables (Backend)

The extension communicates with the backend at `http://localhost:3000` by default.

To change the backend URL, modify `const API_BASE` in `background.js`:

```javascript
const API_BASE = 'http://your-backend-url/api';
```

## Troubleshooting

### Extension not appearing on X pages
- Ensure you're on twitter.com or x.com
- Check that permissions are granted
- Try refreshing the page
- Reload the extension on chrome://extensions/

### Token not validating
- Make sure the token is correct (no extra spaces)
- Check if the token has expired (24-hour validity)
- Generate a new token from your dashboard

### Drafts not injecting
- Ensure the composer is visible on the page
- Check browser console for errors (F12)
- Try manually refreshing X

### Auto-reply not triggering
- Verify auto-reply is enabled in the popup
- Check your auto-reply rules in Settings
- Ensure the post matches your trigger criteria

## Development

### Testing

1. Enable Developer Mode on chrome://extensions/
2. Click "Reload" to apply changes to any modified files
3. Use F12 to view console messages
4. Check background service worker logs via the extension details page

### Adding New Features

The extension follows a simple message-based architecture:

```javascript
// From content script to background:
chrome.runtime.sendMessage(
  { action: 'actionName', data: {...} },
  (response) => { /* handle response */ }
);

// From background script to API:
const response = await fetch(`${API_BASE}/endpoint`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': userId,
    'x-extension-token': token
  },
  body: JSON.stringify(data)
});
```

## Security Considerations

- Token is stored in Chrome's local storage (encrypted by Chrome)
- Tokens expire after 24 hours
- All API communication should use HTTPS in production
- Never hardcode API keys or sensitive data
- Validate all user inputs before sending to API

## Support

For issues or feature requests, visit the NarrativeOS dashboard or contact support.
