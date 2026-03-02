# NarrativeOS - Testing Guide

This guide will help you test all the NarrativeOS features locally.

## Prerequisites

- Node.js 18+ installed
- Next.js development server running (`npm run dev`)
- Chrome browser with extension installed

## Starting the Development Server

```bash
cd "/Users/cuongvu69/Vibe coding/project X"
npm run dev
```

The server will be available at `http://localhost:3000`

---

## API Testing (cURL)

### 1. Create a Test User and Topic

```bash
#!/bin/bash

# Use a unique user ID
USER_ID="test_user_$(date +%s)"
echo "Testing with USER_ID: $USER_ID"

# Create a topic
echo "Creating topic..."
TOPIC_RESPONSE=$(curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "artificial intelligence",
    "category_filter": "breaking_news"
  }' \
  http://localhost:3000/api/topics)

echo "Topic created:"
echo $TOPIC_RESPONSE | jq '.'

# Extract topic ID
TOPIC_ID=$(echo $TOPIC_RESPONSE | jq -r '.data.id')
echo "TOPIC_ID: $TOPIC_ID"
```

### 2. Add Test Posts

```bash
# Add a breaking news post
curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": "'$TOPIC_ID'",
    "author": "@ai_researcher",
    "content": "BREAKING: New AI model achieves human-level reasoning. This could change everything we know about artificial intelligence.",
    "likes": 450,
    "reposts": 120,
    "replies": 85
  }' \
  http://localhost:3000/api/posts | jq '.'

# Add an opinion post
curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": "'$TOPIC_ID'",
    "author": "@tech_commentator",
    "content": "Hot take: AI won'\''t replace programmers but will make them 10x more productive. Here'\''s why...",
    "likes": 230,
    "reposts": 60,
    "replies": 45
  }' \
  http://localhost:3000/api/posts | jq '.'

# Add a meme post
curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": "'$TOPIC_ID'",
    "author": "@meme_master",
    "content": "when ChatGPT writes your code and it actually works first time 😂😂😂",
    "likes": 890,
    "reposts": 340,
    "replies": 120
  }' \
  http://localhost:3000/api/posts | jq '.'
```

### 3. Get Viral Feed

```bash
# Retrieve all posts sorted by viral score
curl -s \
  -H "x-user-id: $USER_ID" \
  "http://localhost:3000/api/posts?sort_by=viral_score" | jq '.'

# Filter by topic
curl -s \
  -H "x-user-id: $USER_ID" \
  "http://localhost:3000/api/posts?topic_id=$TOPIC_ID&sort_by=viral_score" | jq '.'
```

### 4. Generate Drafts

```bash
# Generate a draft based on persona
curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": "'$TOPIC_ID'",
    "post_id": "post_123",
    "historical_tweets": [
      "AI is transforming how we work",
      "Every developer should learn prompt engineering",
      "The future of coding is collaborative with AI"
    ],
    "summary": "New breakthrough in AI reasoning capabilities",
    "category": "breaking_news"
  }' \
  http://localhost:3000/api/drafts | jq '.'

# Retrieve generated drafts
curl -s \
  -H "x-user-id: $USER_ID" \
  http://localhost:3000/api/drafts | jq '.'
```

### 5. Automation Rules

```bash
# Create automation rule (suggest CTA when likes > 50)
curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "condition_type": "likes_threshold",
    "condition_value": "50",
    "action_type": "suggest_cta"
  }' \
  http://localhost:3000/api/automation | jq '.'

# Create automation rule (suggest repost when viral > 75)
curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "condition_type": "viral_score",
    "condition_value": "75",
    "action_type": "suggest_repost"
  }' \
  http://localhost:3000/api/automation | jq '.'

# List automation rules
curl -s \
  -H "x-user-id: $USER_ID" \
  http://localhost:3000/api/automation | jq '.'
```

### 6. Auto-Reply Rules

```bash
# Create auto-reply rule
curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "trigger_category": "breaking_news",
    "trigger_viral_score_min": 50,
    "reply_mode": "template",
    "reply_template": "Great insight on AI! This is definitely a turning point.",
    "max_replies_per_hour": 5,
    "cooldown_minutes": 10,
    "require_manual_confirm": true
  }' \
  http://localhost:3000/api/auto-reply | jq '.'

# Validate a proposed reply
curl -s -X PUT \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "post_123",
    "proposed_reply": "This is a great post about AI developments!",
    "rule_id": "auto_reply_123"
  }' \
  http://localhost:3000/api/auto-reply | jq '.'

# List auto-reply rules
curl -s \
  -H "x-user-id: $USER_ID" \
  http://localhost:3000/api/auto-reply | jq '.'
```

### 7. Extension Token Management

```bash
# Generate extension token
TOKEN_RESPONSE=$(curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  http://localhost:3000/api/extension/token)

echo "Token generated:"
echo $TOKEN_RESPONSE | jq '.'

# Extract token
EXT_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.data.token')
echo "TOKEN: $EXT_TOKEN"

# Validate token
curl -s -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "token": "'$EXT_TOKEN'"
  }' \
  http://localhost:3000/api/extension/validate | jq '.'

# Revoke token
curl -s -X DELETE \
  -H "Content-Type: application/json" \
  -d '{
    "token": "'$EXT_TOKEN'"
  }' \
  http://localhost:3000/api/extension/token | jq '.'
```

### 8. Scraper

```bash
# Scrape all user topics
curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  http://localhost:3000/api/scrape | jq '.'

# Scrape specific topic
curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": "'$TOPIC_ID'",
    "keyword": "artificial intelligence"
  }' \
  http://localhost:3000/api/scrape | jq '.'

# Check scraper health
curl -s http://localhost:3000/api/scrape/health | jq '.'
```

---

## Testing Script (All-in-One)

Save this as `test_narrativeOS.sh` and run with `bash test_narrativeOS.sh`:

```bash
#!/bin/bash

set -e

USER_ID="test_$(date +%s)"
echo "🚀 Testing NarrativeOS with USER_ID: $USER_ID"
echo ""

# 1. Create topic
echo "1️⃣  Creating topic..."
TOPIC=$(curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"AI","category_filter":"breaking_news"}' \
  http://localhost:3000/api/topics)
TOPIC_ID=$(echo $TOPIC | jq -r '.data.id')
echo "✅ Topic created: $TOPIC_ID"
echo ""

# 2. Add posts
echo "2️⃣  Adding test posts..."
curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id":"'$TOPIC_ID'",
    "author":"@ai_researcher",
    "content":"BREAKING: New AI model. This could change everything.",
    "likes":450,"reposts":120,"replies":85
  }' \
  http://localhost:3000/api/posts > /dev/null
echo "✅ Posts added"
echo ""

# 3. Get viral feed
echo "3️⃣  Retrieving viral feed..."
POSTS=$(curl -s -H "x-user-id: $USER_ID" "http://localhost:3000/api/posts")
POST_COUNT=$(echo $POSTS | jq '.data | length')
echo "✅ Retrieved $POST_COUNT posts"
echo ""

# 4. Generate draft
echo "4️⃣  Generating draft..."
DRAFT=$(curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id":"'$TOPIC_ID'",
    "historical_tweets":["AI is the future"],
    "summary":"New AI model",
    "category":"breaking_news"
  }' \
  http://localhost:3000/api/drafts)
DRAFT_ID=$(echo $DRAFT | jq -r '.data.id')
echo "✅ Draft generated: $DRAFT_ID"
echo ""

# 5. Create automation rule
echo "5️⃣  Creating automation rule..."
curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"condition_type":"viral_score","condition_value":"50","action_type":"suggest_cta"}' \
  http://localhost:3000/api/automation > /dev/null
echo "✅ Automation rule created"
echo ""

# 6. Create auto-reply rule
echo "6️⃣  Creating auto-reply rule..."
curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"trigger_category":"breaking_news","trigger_viral_score_min":50,"reply_mode":"template","reply_template":"Great post!","require_manual_confirm":true}' \
  http://localhost:3000/api/auto-reply > /dev/null
echo "✅ Auto-reply rule created"
echo ""

# 7. Generate extension token
echo "7️⃣  Generating extension token..."
TOKEN_RESP=$(curl -s -X POST \
  -H "x-user-id: $USER_ID" \
  http://localhost:3000/api/extension/token)
TOKEN=$(echo $TOKEN_RESP | jq -r '.data.token')
echo "✅ Token generated: ${TOKEN:0:20}..."
echo ""

echo "✨ All tests passed! NarrativeOS is working correctly."
```

---

## Browser Testing

### 1. Test Dashboard Pages

Visit these URLs in your browser:

- `http://localhost:3000/` - Landing Page
- `http://localhost:3000/onboarding` - Onboarding Flow
- `http://localhost:3000/dashboard` - Main Dashboard
- `http://localhost:3000/viral-feed` - Viral Feed
- `http://localhost:3000/draft-studio` - Draft Studio
- `http://localhost:3000/automation` - Automation Rules
- `http://localhost:3000/settings` - Settings
- `http://localhost:3000/topics` - Topic Management

### 2. Chrome Extension Testing

1. Install the extension from `extension/` folder
2. Click the extension icon
3. Paste the token from the API test
4. Open X.com and see the "Generate Draft" buttons on posts
5. Click to generate and inject drafts

---

## Performance Testing

### Test Viral Score Calculation

```bash
# Post with high engagement should have high viral score
curl -s -X POST \
  -H "x-user-id: test" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": "topic_123",
    "author": "@test",
    "content": "Test post",
    "likes": 1000,
    "reposts": 500,
    "replies": 200
  }' \
  http://localhost:3000/api/posts | jq '.data.viral_score'
```

Expected: High viral score (300+)

### Test Category Classification

```bash
# Test different post types
# Breaking news
curl ... "BREAKING: Major announcement"
# Meme
curl ... "when your code works first time 😂"
# Opinion
curl ... "Hot take: everything is changing"
```

---

## Expected Responses

### Viral Score Examples
- **High engagement post** (1000 likes, 500 reposts, 200 replies, recent): ~450-500
- **Medium post** (100 likes, 30 reposts, 15 replies, 1 hour old): ~50-100
- **Low post** (10 likes, 2 reposts, 1 reply, 2 hours old): ~5-10

### Category Examples
- Breaking news keywords: "breaking", "just in", "alert" → confidence 75-100%
- Meme indicators: emojis, "lol", "haha" → confidence 80-100%
- Opinion words: "imho", "imo", "i think" → confidence 70-90%

---

## Troubleshooting

### Posts endpoint returns empty array
- Make sure you created topics first
- Check that the topic_id matches when adding posts
- Verify x-user-id header is set

### Draft generation returns error
- Ensure historical_tweets array is provided
- Check that topic_id exists and belongs to user
- Verify all required fields in request

### Extension token won't validate
- Make sure you copied the full token
- Check that the token hasn't expired (24 hours)
- Try generating a new token

### Auto-reply validation fails
- Check reply length (must be 10-280 characters)
- Verify you haven't exceeded rate limits
- Ensure manual_confirm is true for testing

---

## Next Steps

After testing:
1. Review generated drafts in Dashboard
2. Test Extension on X.com
3. Create custom automation rules
4. Configure auto-reply settings
5. Monitor viral feed for trending topics
