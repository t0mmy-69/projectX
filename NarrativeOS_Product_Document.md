# NarrativeOS - Product Document

> **AI-Powered Narrative & Growth Operating System for X (Twitter)**
> Giup creator theo doi narrative, phat hien viral post, va tu dong tao noi dung chat luong cao.

---

## 1. PRODUCT IDEA

### Van de
Creator tren X dang gap kho khan:
- **Thong tin qua tai**: Hang nghin post moi ngay, khong biet post nao dang viral, narrative nao dang hot
- **Ton thoi gian**: Viet reply/tweet thu cong mat hang gio moi ngay
- **Thieu nhat quan**: Khong co persona ro rang, noi dung khong dong bo
- **Khong co data**: Ra quyet dinh theo cam tinh, khong biet post nao hieu qua

### Giai phap: NarrativeOS
Mot he thong toan dien giup creator:

1. **Theo doi Narrative** - Dat keyword/topic, he thong tu dong quet va phan loai post (breaking news, controversy, opinion...)
2. **Phat hien Viral** - Tinh diem viral theo cong thuc thong minh (likes + 2x reposts + replies / thoi gian), loc ra post dang bung no
3. **Phan tich Persona** - AI doc lich su tweet cua ban, hieu giong van, cach dung emoji, style hook de tao noi dung khop 100%
4. **Tu dong tao Draft** - AI generate 3 hook variations + tweet draft + thread draft cho moi post viral
5. **Auto-Reply thong minh** - Tu dong reply bai viral voi safety system (gioi han 10 reply/gio, cooldown 5 phut, spam detection)
6. **Chrome Extension** - Inject truc tiep vao X, 1-click generate reply, preview truoc khi post

### Diem khac biet
- **Multi-LLM**: Ho tro 5 AI provider (Claude, GPT, Grok, Gemini, DeepSeek) - user chon model phu hop
- **Safety-first**: Khong bao gio tu dong post ma khong co kiem tra an toan
- **Persona-matched**: Moi noi dung deu khop voi giong van cua user, khong generic
- **Rule-based Automation**: IF viral_score > 50 THEN auto_reply - user tu dinh nghia rule
- **Chrome Extension**: Lam viec ngay tren X, khong can chuyen tab

---

## 2. CAU TRUC SAN PHAM HIEN TAI

### 2.1 Kien truc tong quan

```
+------------------+     +-------------------+     +------------------+
|  Chrome Extension | <-> |  Next.js Backend  | <-> |  In-Memory DB    |
|  (Manifest v3)   |     |  (API Routes)     |     |  (Maps - MVP)    |
+------------------+     +-------------------+     +------------------+
                               |
                          +----+----+
                          |  AI/LLM |
                          | Router  |
                          +---------+
                          |         |
                    Claude  GPT  Grok  Gemini  DeepSeek
```

### 2.2 Tech Stack

| Layer | Technology | Ghi chu |
|-------|-----------|---------|
| **Frontend** | Next.js 15 + React 19 + TypeScript | App Router, Server Components |
| **Styling** | Tailwind CSS 3.4 | Dark theme, custom design system |
| **Backend** | Next.js API Routes (35 endpoints) | Serverless tren Vercel |
| **Database** | In-memory Maps (MVP) | Schema san sang cho PostgreSQL |
| **Auth** | JWT (7 ngay) + OAuth 2.0 X | Bao mat voi PBKDF2 hash |
| **AI** | Claude API + 4 provider khac | LLM Router tu dong chon model |
| **Extension** | Chrome Extension Manifest v3 | Content script + Service worker |
| **Deploy** | Vercel | Auto-deploy tu GitHub |

### 2.3 Cac trang chinh (UI)

| Trang | Chuc nang |
|-------|-----------|
| **Landing Page** `/` | Marketing page voi hero, features, pricing |
| **Login/Signup** | Dang nhap/dang ky voi email + password |
| **Onboarding** | Setup persona, chon topics, cai extension |
| **Dashboard** `/dashboard` | Tong quan: so topics, drafts, viral score trung binh |
| **Viral Feed** `/viral-feed` | Feed bai viral, loc theo category, sort theo score |
| **Draft Studio** `/draft-studio` | AI editor: chon tone, xem 3 hook, chinh sua, copy |
| **Topics** `/topics` | Quan ly keyword/topic, bat/tat theo doi |
| **Automation** `/automation` | IF/THEN rule builder, bat/tat tu dong |
| **Agents** `/agents` | Tao/quan ly AI agent, chon LLM, tone, topics |
| **Settings** `/settings` | Profile, API keys cho 5 LLM provider, X account |
| **Admin** `/admin` | Metrics he thong, quan ly API keys, token usage |

### 2.4 Backend API (35 endpoints)

**Authentication (5 routes)**
- `POST /auth/register` - Dang ky tai khoan
- `POST /auth/login` - Dang nhap, tra ve JWT
- `POST /auth/logout` - Dang xuat
- `POST /auth/validate` - Kiem tra JWT con hieu luc
- `GET /auth/x` - OAuth callback tu X

**Topic & Post (7 routes)**
- `GET/POST /api/topics` - CRUD topics
- `PATCH/DELETE /api/topics/[id]` - Cap nhat/xoa topic
- `GET/POST /api/posts` - Lay viral feed / them post
- `POST /api/scrape` - Kich hoat quet X

**Draft & Content (2 routes)**
- `GET /api/drafts` - Lay danh sach draft
- `POST /api/drafts` - AI generate draft moi

**Automation & Auto-Reply (5 routes)**
- `GET/POST /api/automation` - CRUD automation rules
- `PATCH/DELETE /api/automation/[id]` - Cap nhat/xoa rule
- `GET/POST/PUT /api/auto-reply` - Cau hinh + thuc thi auto-reply

**Agent System (5 routes)**
- `GET/POST /api/agents` - CRUD agents
- `GET/PUT/DELETE /api/agents/[id]` - Quan ly agent cu the
- `POST /api/agent/generate` - AI generate reply
- `GET /api/agent/decisions` - Lich su hoat dong agent

**User & Team (6 routes)**
- `GET /api/user/profile` - Thong tin user
- `GET/POST /api/user/llm-keys` - Quan ly API keys
- `GET/POST /api/accounts` - Multi-account X
- `GET/POST /api/teams` - Team workspace

**Admin (5 routes)**
- `GET /api/admin/overview` - Metrics tong quan
- `GET /api/admin/metrics` - Chi tiet tang truong + AI health
- `CRUD /api/admin/api-keys` - Quan ly API keys
- `GET /api/admin/tokens/usage` - Thong ke token
- `GET /api/admin/users` - Danh sach users

### 2.5 Core Logic (27 modules)

**Viral Detection**
- `viralScore.ts` - Cong thuc: `(likes + 2*reposts + replies) / phut`. Ignore post > 24h hoac < 5 engagement
- `categoryEngine.ts` - Phan loai 6 nhom: breaking_news, narrative_shift, opinion, data_research, controversy, meme
- `narrativeDetector.ts` - Phat hien narrative threads, sentiment shift

**AI Content**
- `claudeClient.ts` - Wrapper Anthropic SDK voi retry logic
- `llmRouter.ts` - Route toi 5 provider: Claude, OpenAI, Grok, Gemini, DeepSeek
- `personaEngine.ts` - Phan tich persona tu lich su tweet
- `contentGenerator.ts` - Template fallback khi AI khong kha dung
- `claudeContentGenerator.ts` - Claude generate draft voi caching (6h TTL)

**Safety**
- `autoReplaySafety.ts` - 10 reply/gio, cooldown 5 phut, spam detection, kiem tra do dai
- `automationEngine.ts` - Thuc thi IF/THEN rules
- `cache.ts` - LRU cache voi TTL

**Auth & Security**
- `auth.ts` - JWT + OAuth 2.0 X
- `extensionAuth.ts` - Token 32 ky tu, het han 24h
- `apiKeyManager.ts` - CRUD API keys, san sang ma hoa

### 2.6 Chrome Extension

```
extension/
  manifest.json     - Config, permissions cho x.com
  popup.html/js     - Login, chon agent, bat/tat auto-reply
  content.js        - Inject vao X feed, phat hien post, hien UI reply
  background.js     - Service worker xu ly API calls
  options.html/js   - Cau hinh URL backend, token
  styles.css        - Style cho UI inject
```

**Flow hoat dong:**
1. User login trong extension popup
2. Content script quet X feed bang DOM observer
3. Phat hien post khop topic cua user
4. Hien nut "Generate Reply" ben canh post
5. Goi API backend `/api/agent/generate`
6. Hien preview reply, user confirm
7. Tu dong post reply (neu bat auto-mode)

### 2.7 Data Models

**User** - id, email, name, password_hash, x_username, subscription_tier
**Topic** - id, user_id, keyword, category_filter, is_active
**ScrapedPost** - id, topic_id, author, content, likes, reposts, replies, posted_at
**ViralScore** - id, post_id, score, engagement_rate
**Draft** - id, user_id, hook_1, hook_2, hook_3, tweet_draft, thread_draft
**Agent** - id, user_id, name, prompt, tone, topics[], llm_provider, llm_model, auto_mode
**AutomationRule** - id, user_id, condition_type, condition_value, action_type, is_active

---

## 3. TINH TRANG HIEN TAI

### Da hoan thanh
- [x] Landing page + marketing UI
- [x] Auth system (JWT + OAuth X)
- [x] Topic management
- [x] Viral score calculation + post feed
- [x] 6-category post classification
- [x] AI draft generation (Claude + fallback)
- [x] Persona analysis
- [x] Automation rule builder (IF/THEN)
- [x] Auto-reply voi safety system
- [x] Multi-LLM support (5 providers)
- [x] Agent system (tao, chon model, tone)
- [x] Chrome Extension (full integration)
- [x] Admin dashboard + monitoring
- [x] API key management
- [x] Token usage tracking
- [x] Settings page (profile, API keys, persona)
- [x] Deployment tren Vercel

### Can phat trien tiep
- [ ] Chuyen tu in-memory sang PostgreSQL
- [ ] Ma hoa API keys trong database
- [ ] Key rotation tu dong
- [ ] Advanced analytics dashboard
- [ ] Email notification khi co post viral
- [ ] Webhook cho external integration
- [ ] Pricing tiers (Free / Creator / Agency)
- [ ] Onboarding flow hoan chinh

---

## 4. METRICS & PERFORMANCE

| Metric | Gia tri |
|--------|---------|
| Tong so trang UI | 14 pages |
| Tong so API endpoints | 35 routes |
| Core logic modules | 27 files |
| LLM providers | 5 (Claude, GPT, Grok, Gemini, DeepSeek) |
| Post categories | 6 loai |
| Safety checks | 5 lop (rate limit, cooldown, spam, length, manual confirm) |
| Build size | ~110 kB first load JS |
| Build time | ~3 giay |
| Deploy | Vercel auto-deploy tu GitHub |

---

*Document generated: March 2026*
*Version: MVP 0.1.0*
