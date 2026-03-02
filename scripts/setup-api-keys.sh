#!/bin/bash

# NarrativeOS API Keys Setup Script
# This script helps you configure API keys for NarrativeOS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
ADMIN_USER_ID="${ADMIN_USER_ID:-admin_default}"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  NarrativeOS API Keys Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Login
echo -e "${YELLOW}Step 1: Authenticating as admin...${NC}"
read -p "Enter your email: " EMAIL
read -p "Enter your name: " NAME

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"$ADMIN_USER_ID\",
    \"email\": \"$EMAIL\",
    \"name\": \"$NAME\"
  }")

JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$JWT_TOKEN" ]; then
  echo -e "${RED}✗ Authentication failed${NC}"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Authenticated successfully${NC}"
echo ""

# Step 2: Check current keys
echo -e "${YELLOW}Step 2: Checking current API keys...${NC}"
curl -s -X GET "$API_URL/api/admin/api-keys" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "x-user-id: $ADMIN_USER_ID" | jq '.data.keys | length' > /dev/null

echo -e "${GREEN}✓ Connected to API${NC}"
echo ""

# Step 3: Add keys interactively
echo -e "${YELLOW}Step 3: Add your API keys${NC}"
echo -e "${BLUE}(Leave blank to skip)${NC}"
echo ""

# Claude API Key
echo -e "${YELLOW}Claude API Key (${BLUE}sk-ant-...${YELLOW})${NC}"
read -sp "Enter your Claude API key: " CLAUDE_KEY
echo ""

if [ ! -z "$CLAUDE_KEY" ]; then
  RESPONSE=$(curl -s -X POST "$API_URL/api/admin/api-keys" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"key_name\": \"ANTHROPIC_API_KEY\",
      \"key_value\": \"$CLAUDE_KEY\",
      \"validate_only\": true
    }")

  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Claude API key is valid${NC}"

    curl -s -X POST "$API_URL/api/admin/api-keys" \
      -H "Authorization: Bearer $JWT_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"key_name\": \"ANTHROPIC_API_KEY\",
        \"key_value\": \"$CLAUDE_KEY\"
      }" > /dev/null

    echo -e "${GREEN}✓ Saved Claude API key${NC}"
  else
    echo -e "${RED}✗ Invalid Claude API key${NC}"
  fi
fi
echo ""

# X API Token
echo -e "${YELLOW}X (Twitter) API Bearer Token${NC}"
read -sp "Enter your X API token: " X_TOKEN
echo ""

if [ ! -z "$X_TOKEN" ]; then
  RESPONSE=$(curl -s -X POST "$API_URL/api/admin/api-keys" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"key_name\": \"X_API_TOKEN\",
      \"key_value\": \"$X_TOKEN\",
      \"validate_only\": true
    }")

  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ X API token is valid${NC}"

    curl -s -X POST "$API_URL/api/admin/api-keys" \
      -H "Authorization: Bearer $JWT_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"key_name\": \"X_API_TOKEN\",
        \"key_value\": \"$X_TOKEN\"
      }" > /dev/null

    echo -e "${GREEN}✓ Saved X API token${NC}"
  else
    echo -e "${RED}✗ Invalid X API token${NC}"
  fi
fi
echo ""

# X Client ID
echo -e "${YELLOW}X OAuth Client ID${NC}"
read -p "Enter your X OAuth Client ID: " X_CLIENT_ID
echo ""

if [ ! -z "$X_CLIENT_ID" ]; then
  curl -s -X POST "$API_URL/api/admin/api-keys" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"key_name\": \"X_CLIENT_ID\",
      \"key_value\": \"$X_CLIENT_ID\"
    }" > /dev/null

  echo -e "${GREEN}✓ Saved X Client ID${NC}"
fi
echo ""

# X Client Secret
echo -e "${YELLOW}X OAuth Client Secret${NC}"
read -sp "Enter your X OAuth Client Secret: " X_CLIENT_SECRET
echo ""

if [ ! -z "$X_CLIENT_SECRET" ]; then
  curl -s -X POST "$API_URL/api/admin/api-keys" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"key_name\": \"X_CLIENT_SECRET\",
      \"key_value\": \"$X_CLIENT_SECRET\"
    }" > /dev/null

  echo -e "${GREEN}✓ Saved X Client Secret${NC}"
fi
echo ""

# X Redirect URI
echo -e "${YELLOW}X OAuth Redirect URI${NC}"
echo -e "${BLUE}(Default: http://localhost:3001/api/auth/x/callback)${NC}"
read -p "Enter your X Redirect URI: " X_REDIRECT_URI

if [ -z "$X_REDIRECT_URI" ]; then
  X_REDIRECT_URI="http://localhost:3001/api/auth/x/callback"
fi

curl -s -X POST "$API_URL/api/admin/api-keys" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"key_name\": \"X_REDIRECT_URI\",
    \"key_value\": \"$X_REDIRECT_URI\"
  }" > /dev/null

echo -e "${GREEN}✓ Saved X Redirect URI${NC}"
echo ""

# Step 4: List configured keys
echo -e "${YELLOW}Step 4: Configured API Keys${NC}"
curl -s -X GET "$API_URL/api/admin/api-keys" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "x-user-id: $ADMIN_USER_ID" | jq '.data | {configured: .configured_keys, total_required: (.required_keys | length), keys: .keys[] | {key_name, is_active, last_used_at}}'

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Setup Complete! ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Your JWT token (save this): ${BLUE}$JWT_TOKEN${NC}"
echo ""
echo "Next steps:"
echo "1. Test each API key: curl -X PUT $API_URL/api/admin/api-keys -H \"Authorization: Bearer $JWT_TOKEN\" -d '{\"key_name\": \"ANTHROPIC_API_KEY\", \"action\": \"test\"}'"
echo "2. Check admin dashboard: curl -X GET $API_URL/api/admin/overview -H \"Authorization: Bearer $JWT_TOKEN\""
echo "3. Start using NarrativeOS!"
echo ""
