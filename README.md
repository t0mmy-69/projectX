<p align="center">
  <h1 align="center">NarrativeOS</h1>
  <p align="center">
    <strong>AI-Powered Narrative & Growth Operating System for X (Twitter)</strong>
  </p>
  <p align="center">
    Track narratives. Detect viral posts. Generate high-impact content. Grow faster.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.3-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Chrome_Extension-Manifest_v3-4285F4?logo=googlechrome" alt="Chrome Extension" />
  <img src="https://img.shields.io/badge/Deployed_on-Vercel-000?logo=vercel" alt="Vercel" />
</p>

---

## What is NarrativeOS?

NarrativeOS is an all-in-one operating system for X (Twitter) creators. It combines **AI-powered content generation**, **viral post detection**, **narrative tracking**, and **automated engagement** into a single platform with a Chrome Extension that works directly on X.

### The Problem

Creators on X spend hours every day:
- Scrolling through thousands of posts to find trending topics
- Writing replies and tweets manually with no data-driven strategy
- Posting inconsistently without a clear persona or voice
- Missing viral opportunities because they can't monitor 24/7

### The Solution

NarrativeOS automates the entire workflow:

| Feature | Description |
|---------|-------------|
| **Narrative Tracking** | Subscribe to topics/keywords, auto-scrape and classify posts |
| **Viral Detection** | Smart scoring formula ranks posts by virality in real-time |
| **Persona Analysis** | AI analyzes your tweet history to match your unique voice |
| **Draft Generation** | AI generates 3 hook variations + tweet drafts + thread drafts |
| **Auto-Reply** | Smart auto-reply with 5-layer safety system |
| **Chrome Extension** | 1-click generate replies directly on X |
| **Multi-LLM Support** | Choose from Claude, GPT, Grok, Gemini, or DeepSeek |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15.3 + React 19 + TypeScript |
| **Styling** | Tailwind CSS 3.4 + Custom Design System |
| **Backend** | Next.js API Routes (35 endpoints) |
| **Database** | In-memory Maps (MVP) — PostgreSQL ready |
| **Auth** | JWT (7-day expiry) + OAuth 2.0 for X |
| **AI** | Multi-LLM Router (Claude, GPT, Grok, Gemini, DeepSeek) |
| **Extension** | Chrome Extension Manifest v3 |
| **Deployment** | Vercel (auto-deploy from GitHub) |

---

## Project Structure

```
narrativeos/
├── src/
│   ├── app/
│   │   ├── page.tsx                # Landing page
│   │   ├── layout.tsx              # Root layout (Figtree font, dark theme)
│   │   ├── login/                  # Login page
│   │   ├── signup/                 # Signup page
│   │   ├── onboarding/            # User onboarding flow
│   │   ├── dashboard/             # Main dashboard
│   │   ├── viral-feed/            # Viral post feed with filters
│   │   ├── draft-studio/          # AI draft editor
│   │   ├── topics/                # Topic management
│   │   ├── automation/            # IF/THEN rule builder
│   │   ├── agents/                # AI agent management
│   │   ├── settings/              # Profile, API keys, persona
│   │   ├── admin/                 # Admin dashboard & monitoring
│   │   ├── changelog/             # Product changelog
│   │   ├── demo/                  # Demo page
│   │   ├── components/            # Shared UI components
│   │   └── api/                   # Backend API routes (35 endpoints)
│   │       ├── auth/              # Register, login, logout, OAuth
│   │       ├── topics/            # Topic CRUD
│   │       ├── posts/             # Post management
│   │       ├── drafts/            # AI draft generation
│   │       ├── automation/        # Automation rules
│   │       ├── auto-reply/        # Auto-reply config & execution
│   │       ├── agents/            # Agent CRUD
│   │       ├── agent/             # AI generation & decisions
│   │       ├── scrape/            # X scraping trigger
│   │       ├── user/              # User profile & LLM keys
│   │       ├── accounts/          # Multi-account X
│   │       ├── teams/             # Team workspaces
│   │       ├── narratives/        # Narrative detection
│   │       ├── analytics/         # Analytics data
│   │       ├── admin/             # Admin metrics & API key management
│   │       └── extension/         # Extension token management
│   └── lib/                       # Core logic (27 modules)
│       ├── viralScore.ts          # Viral score calculation
│       ├── categoryEngine.ts      # Post classification (6 categories)
│       ├── narrativeDetector.ts   # Narrative thread detection
│       ├── personaEngine.ts       # Persona analysis from tweets
│       ├── contentGenerator.ts    # Template-based content gen
│       ├── claudeClient.ts        # Anthropic SDK wrapper
│       ├── claudeContentGenerator.ts  # Claude draft generation
│       ├── claudePersonaEngine.ts # Claude persona analysis
│       ├── claudeClassifier.ts    # Claude post classification
│       ├── claudeSummary.ts       # Claude summarization
│       ├── llmRouter.ts           # Multi-LLM routing
│       ├── sentimentAnalyzer.ts   # Sentiment analysis
│       ├── automationEngine.ts    # IF/THEN rule execution
│       ├── autoReplaySafety.ts    # Auto-reply safety checks
│       ├── advancedAutomation.ts  # Advanced automation rules
│       ├── auth.ts                # JWT + OAuth logic
│       ├── extensionAuth.ts       # Extension token system
│       ├── apiKeyManager.ts       # API key CRUD & validation
│       ├── tokenTracking.ts       # Token usage tracking
│       ├── db.ts                  # Database schema & in-memory storage
│       ├── dbInit.ts              # Database initialization
│       ├── cache.ts               # LRU cache with TTL
│       ├── scraper.ts             # X scraping (mock for MVP)
│       ├── xApiClient.ts          # X API client
│       └── ...
├── extension/                     # Chrome Extension
│   ├── manifest.json              # Manifest v3 config
│   ├── popup.html / popup.js      # Extension popup UI
│   ├── content.js                 # Injected into X pages
│   ├── background.js              # Service worker
│   ├── options.html / options.js  # Extension settings
│   ├── styles.css                 # Injected styles
│   └── assets/                    # Icons & images
├── next.config.mjs                # Next.js config (webpack aliases)
├── tailwind.config.js             # Tailwind CSS config
├── vercel.json                    # Vercel deployment config
├── tsconfig.json                  # TypeScript config
└── package.json                   # Dependencies & scripts
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 20 (recommended: 22)
- **npm** >= 10
- API key for at least one LLM provider (Claude recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/t0mmy-69/projectX.git
cd projectX

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...        # Claude API key

# X API (optional for MVP - mock data available)
X_API_TOKEN=your_x_bearer_token
X_CLIENT_ID=your_oauth_client_id
X_CLIENT_SECRET=your_oauth_secret
X_REDIRECT_URI=http://localhost:3000/api/auth/x

# Auth
JWT_SECRET=your_jwt_secret          # Auto-generated if not set
JWT_EXPIRY=7d

# Database (optional - uses in-memory by default)
DATABASE_URL=postgresql://...

# Optional
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

### Running Locally

```bash
# Development server
npm run dev
# Open http://localhost:3000

# Production build
npm run build
npm start
```

### Chrome Extension Setup

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `extension/` folder
4. Click the NarrativeOS extension icon
5. Enter your backend URL and authenticate

---

## Key Features

### Viral Score Algorithm

```
score = (likes + 2 × reposts + replies) / minutes_since_posted
```
- Normalized by follower count
- Ignores posts older than 24 hours
- Minimum 5 total engagements required

### Post Categories

| Category | Trigger Keywords |
|----------|-----------------|
| Breaking News | "breaking", "just in", "alert" |
| Narrative Shift | "shift", "plot twist", "turning point" |
| Opinion | "imho", "i think", "unpopular opinion" |
| Data/Research | "data", "study", "analysis", "chart" |
| Controversy | "scandal", "backlash", "called out" |
| Meme | "lol", emojis, "no cap" |

### Auto-Reply Safety System

5-layer protection to prevent spam:

1. **Rate Limit** — Max 10 replies per hour
2. **Cooldown** — 5-minute gap between replies
3. **Spam Detection** — Pattern matching against known spam
4. **Length Validation** — 10-280 characters enforced
5. **Manual Confirmation** — Required by default (can be disabled)

### Multi-LLM Router

Supports 5 AI providers with automatic failover:

| Provider | Models |
|----------|--------|
| Claude (Anthropic) | claude-3.5-sonnet, claude-3-opus |
| GPT (OpenAI) | gpt-4o, gpt-4-turbo |
| Grok (xAI) | grok-2 |
| Gemini (Google) | gemini-pro |
| DeepSeek | deepseek-chat |

---

## API Overview

| Group | Routes | Description |
|-------|--------|-------------|
| Auth | 5 | Register, login, logout, JWT validation, OAuth X |
| Topics | 4 | CRUD topic subscriptions |
| Posts | 3 | Viral feed, post management, scraping |
| Drafts | 2 | AI draft generation & listing |
| Automation | 4 | IF/THEN rule builder |
| Auto-Reply | 3 | Config, execute, validate |
| Agents | 5 | AI agent CRUD & generation |
| User | 4 | Profile, LLM keys, accounts |
| Teams | 2 | Team workspaces |
| Admin | 5 | Metrics, API keys, token usage |
| Extension | 3 | Token management |
| **Total** | **35+** | |

---

## Deployment

### Vercel (Recommended)

The project is configured for Vercel with auto-deploy from GitHub.

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm ci --include=dev",
  "regions": ["iad1"]
}
```

Key deployment notes:
- Uses `npm ci --include=dev` to ensure Tailwind CSS is installed in production builds
- Node.js 22 (configured via `.nvmrc`)
- Webpack aliases configured in `next.config.mjs` for Vercel compatibility

---

## Roadmap

- [x] Core platform (dashboard, viral feed, draft studio)
- [x] Multi-LLM support (5 providers)
- [x] Chrome Extension with DOM injection
- [x] Auto-reply with safety system
- [x] Agent system with custom prompts
- [x] Admin dashboard & monitoring
- [x] API key management
- [x] Vercel deployment
- [ ] PostgreSQL migration
- [ ] API key encryption in database
- [ ] Key rotation scheduling
- [ ] Advanced analytics dashboard
- [ ] Email notifications for viral posts
- [ ] Webhook integrations
- [ ] Pricing tiers (Free / Creator / Agency)

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

---

## License

This project is private and proprietary.

---

<p align="center">
  Built with Next.js, React, TypeScript, and AI
</p>
