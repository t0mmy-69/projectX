# NarrativeOS API Documentation

## Overview
The NarrativeOS API provides endpoints for managing topics, posts, drafts, automation rules, and auto-reply functionality. All requests should include the user ID in the `x-user-id` header for authentication (in production, use proper OAuth).

## Base URL
```
http://localhost:3000/api
```

## Authentication
Include user ID in request headers:
```
x-user-id: your-user-id
x-extension-token: extension-token-for-extension-requests
```

---

## Topics API

### GET /topics
Retrieve all topics for the authenticated user.

**Request:**
```bash
curl -H "x-user-id: user123" http://localhost:3000/api/topics
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "topic_1234567890_abc123",
      "user_id": "user123",
      "keyword": "AI",
      "category_filter": "breaking_news",
      "is_active": true,
      "created_at": "2026-02-28T16:00:00Z",
      "updated_at": "2026-02-28T16:00:00Z"
    }
  ]
}
```

### POST /topics
Create a new topic.

**Request:**
```bash
curl -X POST \
  -H "x-user-id: user123" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "cryptocurrency",
    "category_filter": "breaking_news"
  }' \
  http://localhost:3000/api/topics
```

**Request Body:**
```json
{
  "keyword": "cryptocurrency",
  "category_filter": "breaking_news" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Topic created successfully",
  "data": {
    "id": "topic_1234567890_def456",
    "user_id": "user123",
    "keyword": "cryptocurrency",
    "is_active": true,
    "created_at": "2026-02-28T16:15:00Z",
    "updated_at": "2026-02-28T16:15:00Z"
  }
}
```

---

## Posts API

### GET /posts
Retrieve viral feed for user's topics.

**Query Parameters:**
- `topic_id` (optional): Filter by specific topic
- `sort_by` (optional): `viral_score`, `recent`, `trending` (default: `viral_score`)

**Request:**
```bash
curl -H "x-user-id: user123" \
  "http://localhost:3000/api/posts?sort_by=viral_score"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "post_1234567890_abc",
      "topic_id": "topic_123",
      "author": "@username",
      "content": "Post content here",
      "likes": 150,
      "reposts": 45,
      "replies": 23,
      "posted_at": "2026-02-28T15:00:00Z",
      "viral_score": 87.5,
      "category": "breaking_news",
      "engagement_rate": 2.18
    }
  ],
  "total": 1
}
```

### POST /posts
Manually add a post (for testing/scraping).

**Request:**
```bash
curl -X POST \
  -H "x-user-id: user123" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": "topic_123",
    "author": "@john_doe",
    "content": "Just launched new AI feature!",
    "likes": 100,
    "reposts": 30,
    "replies": 15
  }' \
  http://localhost:3000/api/posts
```

**Request Body:**
```json
{
  "topic_id": "topic_123",
  "author": "@username",
  "content": "Post content",
  "likes": 100,
  "reposts": 30,
  "replies": 15
}
```

**Response:**
```json
{
  "success": true,
  "message": "Post added successfully",
  "data": {
    "id": "post_123",
    "viral_score": 67.3,
    "category": "breaking_news"
  }
}
```

---

## Drafts API

### GET /drafts
Retrieve all drafts for the user.

**Request:**
```bash
curl -H "x-user-id: user123" http://localhost:3000/api/drafts
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "draft_123",
      "user_id": "user123",
      "topic_id": "topic_123",
      "hook_variation_1": "Did you know about the new AI breakthrough?",
      "hook_variation_2": "Hot take: AI is changing everything",
      "hook_variation_3": "What if AI could do X?",
      "tweet_draft": "Did you know about the new AI breakthrough?\n\nThis changes everything for developers...",
      "thread_draft": "1/3\nA thread on AI breakthroughs",
      "based_on_post_id": "post_123",
      "cache_expires_at": "2026-02-28T22:00:00Z",
      "created_at": "2026-02-28T16:00:00Z"
    }
  ]
}
```

### POST /drafts
Generate a new draft based on persona and content.

**Request:**
```bash
curl -X POST \
  -H "x-user-id: user123" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": "topic_123",
    "post_id": "post_123",
    "historical_tweets": ["tweet 1", "tweet 2"],
    "summary": "Post about AI breakthroughs",
    "category": "breaking_news"
  }' \
  http://localhost:3000/api/drafts
```

**Request Body:**
```json
{
  "topic_id": "topic_123",
  "post_id": "post_123",
  "historical_tweets": ["your past tweets"],
  "summary": "Post summary",
  "category": "breaking_news"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Draft generated successfully",
  "data": {
    "id": "draft_123",
    "hook_variation_1": "...",
    "hook_variation_2": "...",
    "hook_variation_3": "...",
    "tweet_draft": "..."
  }
}
```

---

## Automation API

### GET /automation
Retrieve all automation rules for the user.

**Request:**
```bash
curl -H "x-user-id: user123" http://localhost:3000/api/automation
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "rule_123",
      "user_id": "user123",
      "condition_type": "viral_score",
      "condition_value": "50",
      "action_type": "suggest_cta",
      "is_active": true,
      "created_at": "2026-02-28T16:00:00Z"
    }
  ]
}
```

### POST /automation
Create a new automation rule.

**Request:**
```bash
curl -X POST \
  -H "x-user-id: user123" \
  -H "Content-Type: application/json" \
  -d '{
    "condition_type": "viral_score",
    "condition_value": "50",
    "action_type": "suggest_cta"
  }' \
  http://localhost:3000/api/automation
```

**Request Body:**
```json
{
  "condition_type": "viral_score|category_match|likes_threshold|age_threshold",
  "condition_value": "50",
  "action_type": "suggest_cta|suggest_repost|auto_reply|notify"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rule created successfully",
  "data": {
    "id": "rule_123",
    "condition_type": "viral_score",
    "condition_value": "50",
    "action_type": "suggest_cta",
    "is_active": true
  }
}
```

---

## Auto-Reply API

### GET /auto-reply
Retrieve all auto-reply rules for the user.

**Request:**
```bash
curl -H "x-user-id: user123" http://localhost:3000/api/auto-reply
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "auto_reply_123",
      "user_id": "user123",
      "trigger_category": "breaking_news",
      "trigger_viral_score_min": 50,
      "trigger_topic_match": true,
      "exclude_meme": true,
      "reply_mode": "template",
      "reply_template": "Great insight! {{emoji}}",
      "max_replies_per_hour": 10,
      "cooldown_minutes": 5,
      "require_manual_confirm": true,
      "is_active": true
    }
  ]
}
```

### POST /auto-reply
Create a new auto-reply rule.

**Request:**
```bash
curl -X POST \
  -H "x-user-id: user123" \
  -H "Content-Type: application/json" \
  -d '{
    "trigger_category": "breaking_news",
    "trigger_viral_score_min": 50,
    "reply_mode": "template",
    "reply_template": "Interesting take!",
    "max_replies_per_hour": 10,
    "require_manual_confirm": true
  }' \
  http://localhost:3000/api/auto-reply
```

**Request Body:**
```json
{
  "trigger_category": "breaking_news",
  "trigger_viral_score_min": 50,
  "trigger_topic_match": true,
  "exclude_meme": true,
  "reply_mode": "template|ai_persona|hybrid",
  "reply_template": "Reply text",
  "max_replies_per_hour": 10,
  "cooldown_minutes": 5,
  "require_manual_confirm": true
}
```

### PUT /auto-reply
Validate a proposed reply before sending.

**Request:**
```bash
curl -X PUT \
  -H "x-user-id: user123" \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "post_123",
    "proposed_reply": "Great insight on AI!",
    "rule_id": "auto_reply_123"
  }' \
  http://localhost:3000/api/auto-reply
```

**Response:**
```json
{
  "success": true,
  "data": {
    "is_safe": true,
    "recommendation": "Ready to send (awaiting your confirmation)",
    "warnings": [],
    "requires_confirmation": true
  }
}
```

---

## Scraper API

### POST /scrape
Trigger post scraping for topics.

**Request:**
```bash
curl -X POST \
  -H "x-user-id: user123" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/scrape
```

**Request Body (For specific topic):**
```json
{
  "topic_id": "topic_123",
  "keyword": "AI"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scraped 10 posts for topic",
  "data": {
    "topic_id": "topic_123",
    "posts_count": 10,
    "posts": [...]
  }
}
```

### GET /scrape/health
Check scraper health status.

**Request:**
```bash
curl http://localhost:3000/api/scrape/health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "message": "Scraper service is running",
  "timestamp": "2026-02-28T16:00:00Z"
}
```

---

## Extension API

### POST /extension/token
Generate a new extension token.

**Request:**
```bash
curl -X POST \
  -H "x-user-id: user123" \
  http://localhost:3000/api/extension/token
```

**Response:**
```json
{
  "success": true,
  "message": "Extension token generated",
  "data": {
    "token": "AbCdEfGhIjKlMnOpQrStUvWxYz-_1234",
    "expires_at": "2026-02-29T16:00:00Z",
    "instructions": "Copy this token and paste it into the NarrativeOS Chrome Extension"
  }
}
```

### PUT /extension/validate
Validate an extension token.

**Request:**
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "token": "AbCdEfGhIjKlMnOpQrStUvWxYz-_1234"
  }' \
  http://localhost:3000/api/extension/validate
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user_id": "user123",
    "valid": true
  }
}
```

### DELETE /extension/token
Revoke an extension token.

**Request:**
```bash
curl -X DELETE \
  -H "Content-Type: application/json" \
  -d '{
    "token": "AbCdEfGhIjKlMnOpQrStUvWxYz-_1234"
  }' \
  http://localhost:3000/api/extension/token
```

**Response:**
```json
{
  "success": true,
  "message": "Token revoked successfully"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": "Additional details if available"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `500` - Server error

---

## Rate Limiting

For auto-reply operations:
- **Max replies per hour**: 10
- **Cooldown between replies**: 5 minutes
- **Reply character limit**: 280

---

## Testing

### Quick Test Script

```bash
#!/bin/bash

USER_ID="test_user_$(date +%s)"

# Create topic
TOPIC=$(curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"AI"}' \
  http://localhost:3000/api/topics)

TOPIC_ID=$(echo $TOPIC | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

echo "Created topic: $TOPIC_ID"

# Add test post
curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d "{\"topic_id\":\"$TOPIC_ID\",\"author\":\"@test\",\"content\":\"Testing AI\",\"likes\":100,\"reposts\":30,\"replies\":15}" \
  http://localhost:3000/api/posts

# Get posts
curl -s -H "x-user-id: $USER_ID" http://localhost:3000/api/posts
```

---

## Development Notes

- Replace in-memory storage with PostgreSQL for production
- Implement proper OAuth/JWT authentication
- Add rate limiting middleware
- Add request validation and sanitization
- Enable HTTPS and CORS properly
- Add comprehensive error logging
- Implement caching layer for frequently accessed data
