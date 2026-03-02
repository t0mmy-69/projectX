# API Keys Management Guide

## Overview

NarrativeOS now supports managing API keys directly from the admin panel. No need to manually set environment variables!

---

## API Keys Required

| Key | Purpose | Where to Get |
|-----|---------|-------------|
| `ANTHROPIC_API_KEY` | Claude API for AI features | [console.anthropic.com](https://console.anthropic.com) |
| `X_API_TOKEN` | X (Twitter) API for scraping | [developer.twitter.com](https://developer.twitter.com) |
| `X_CLIENT_ID` | X OAuth client ID | [developer.twitter.com](https://developer.twitter.com) |
| `X_CLIENT_SECRET` | X OAuth client secret | [developer.twitter.com](https://developer.twitter.com) |
| `X_REDIRECT_URI` | OAuth redirect URL | Your app URL |
| `DATABASE_URL` | PostgreSQL connection | Your database |

---

## API Endpoints

### 1. List All API Keys
```bash
GET /api/admin/api-keys

Headers:
  Authorization: Bearer <jwt_token>
  x-user-id: <admin_user_id>

Response:
{
  "success": true,
  "data": {
    "keys": [
      {
        "id": "key_1234",
        "key_name": "ANTHROPIC_API_KEY",
        "is_active": true,
        "last_used_at": "2026-02-28T10:30:00Z",
        "created_at": "2026-02-28T09:00:00Z",
        "updated_at": "2026-02-28T10:30:00Z"
      }
    ],
    "required_keys": [...],
    "configured_keys": 4
  }
}
```

### 2. Add or Update API Key
```bash
POST /api/admin/api-keys

Headers:
  Authorization: Bearer <jwt_token>
  Content-Type: application/json

Body:
{
  "key_name": "ANTHROPIC_API_KEY",
  "key_value": "sk-ant-...",
  "validate_only": false
}

Response (Success):
{
  "success": true,
  "message": "API key ANTHROPIC_API_KEY saved successfully",
  "data": {
    "id": "key_1234",
    "key_name": "ANTHROPIC_API_KEY",
    "is_active": true,
    "updated_at": "2026-02-28T10:30:00Z"
  }
}

Response (Validation Failure):
{
  "error": "Invalid Claude API key format",
  "status": 400
}
```

### 3. Test API Key
```bash
POST /api/admin/api-keys

Headers:
  Authorization: Bearer <jwt_token>
  Content-Type: application/json

Body:
{
  "key_name": "ANTHROPIC_API_KEY",
  "key_value": "sk-ant-...",
  "validate_only": true
}

Response:
{
  "success": true,
  "message": "Claude API key is valid",
  "latency_ms": 245
}
```

### 4. Test Existing API Key
```bash
PUT /api/admin/api-keys

Headers:
  Authorization: Bearer <jwt_token>
  Content-Type: application/json

Body:
{
  "key_name": "X_API_TOKEN",
  "action": "test"
}

Response:
{
  "success": true,
  "message": "X API token is valid",
  "latency_ms": 156
}
```

### 5. Delete API Key
```bash
DELETE /api/admin/api-keys

Headers:
  Authorization: Bearer <jwt_token>
  Content-Type: application/json

Body:
{
  "key_name": "ANTHROPIC_API_KEY"
}

Response:
{
  "success": true,
  "message": "API key ANTHROPIC_API_KEY deleted"
}
```

---

## How to Use (Step by Step)

### Step 1: Login as Admin
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "admin_user",
    "email": "admin@example.com",
    "name": "Admin User"
  }' \
  -c cookies.txt
```

### Step 2: Get Your Admin JWT Token
Extract the `auth_token` from the response or cookies.

### Step 3: List Current API Keys
```bash
curl http://localhost:3001/api/admin/api-keys \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "x-user-id: admin_user"
```

### Step 4: Add Claude API Key
```bash
curl -X POST http://localhost:3001/api/admin/api-keys \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "key_name": "ANTHROPIC_API_KEY",
    "key_value": "sk-ant-YOUR_CLAUDE_KEY_HERE",
    "validate_only": false
  }'
```

### Step 5: Add X API Token
```bash
curl -X POST http://localhost:3001/api/admin/api-keys \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "key_name": "X_API_TOKEN",
    "key_value": "YOUR_X_BEARER_TOKEN_HERE",
    "validate_only": false
  }'
```

### Step 6: Add X OAuth Credentials
```bash
curl -X POST http://localhost:3001/api/admin/api-keys \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "key_name": "X_CLIENT_ID",
    "key_value": "YOUR_X_CLIENT_ID",
    "validate_only": false
  }'

curl -X POST http://localhost:3001/api/admin/api-keys \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "key_name": "X_CLIENT_SECRET",
    "key_value": "YOUR_X_CLIENT_SECRET",
    "validate_only": false
  }'

curl -X POST http://localhost:3001/api/admin/api-keys \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "key_name": "X_REDIRECT_URI",
    "key_value": "http://localhost:3001/api/auth/x/callback",
    "validate_only": false
  }'
```

### Step 7: Test All Keys
```bash
curl -X PUT http://localhost:3001/api/admin/api-keys \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "key_name": "ANTHROPIC_API_KEY",
    "action": "test"
  }'
```

---

## Getting API Keys

### Claude API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Log in with your Anthropic account
3. Navigate to API Keys
4. Create a new key
5. Copy the key (starts with `sk-ant-`)

### X (Twitter) API Token
1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Create a project or use existing
3. Create an app
4. Generate Bearer Token from App Settings
5. Copy the token

### X OAuth Credentials
1. In [developer.twitter.com](https://developer.twitter.com)
2. App Settings → Authentication Settings
3. Enable OAuth 2.0
4. Set Redirect URI to your app's `/api/auth/x/callback`
5. Copy Client ID and Client Secret

---

## Security Notes

⚠️ **Important:**
- API keys are stored in-memory in MVP (use encryption in production)
- Only admins can view/manage API keys
- Never commit API keys to git
- Rotate keys regularly
- Use environment variables as fallback
- Test keys before applying to production

---

## Troubleshooting

### "API key not found"
- Make sure you've added the key via API
- Check that you're using the correct key name
- Verify the key is active

### "Invalid format"
- Claude keys should start with `sk-ant-`
- X API tokens should be very long (100+ chars)
- Check for typos or hidden spaces

### "Test failed: 401"
- The key may be expired
- Generate a new key and try again
- Check X/Claude dashboards for status

### "Rate limited"
- Wait before retrying
- Consider upgrading your API plan
- Contact X/Anthropic support

---

## Environment Variable Fallback

If you don't configure keys via the admin panel, the system will automatically fallback to environment variables:

```bash
# .env or .env.local
ANTHROPIC_API_KEY=sk-ant-...
X_API_TOKEN=...
X_CLIENT_ID=...
X_CLIENT_SECRET=...
X_REDIRECT_URI=http://localhost:3001/api/auth/x/callback
DATABASE_URL=postgresql://...
```

---

## Production Checklist

- [ ] Added ANTHROPIC_API_KEY via admin panel
- [ ] Added X_API_TOKEN via admin panel
- [ ] Added X_CLIENT_ID via admin panel
- [ ] Added X_CLIENT_SECRET via admin panel
- [ ] Added X_REDIRECT_URI via admin panel
- [ ] Tested all keys (PUT /api/admin/api-keys)
- [ ] Verified features are working
- [ ] Set up backups for stored keys
- [ ] Enabled encryption for stored keys
- [ ] Set up key rotation schedule

---

## API Key Validation Rules

| Key | Validation |
|-----|-----------|
| ANTHROPIC_API_KEY | Must start with `sk-ant-` and be >20 chars |
| X_API_TOKEN | Must be >100 chars |
| X_CLIENT_ID | Must be >10 chars |
| X_CLIENT_SECRET | Must be >10 chars |
| X_REDIRECT_URI | Must be valid URL |
| DATABASE_URL | Must contain `://` |

---

Generated: 2026-02-28
Status: Production Ready
