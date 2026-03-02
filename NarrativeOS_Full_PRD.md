# NarrativeOS for X

## Full Product Requirements Document (PRD)

Generated on: 2026-02-28

------------------------------------------------------------------------

# 1. Product Overview

NarrativeOS is an AI-powered Narrative & Growth Operating System for X.

Core Goals: - Track topics users care about - Detect viral posts by
category - Analyze narrative shifts - Generate summaries - Suggest
hooks - Clone user writing style - Support auto reply and draft
injection via Chrome Extension - Optimize AI token usage

System does NOT rely on official X API.

------------------------------------------------------------------------

# 2. System Architecture Overview

System has 3 main layers:

1.  Backend (Brain)
2.  Chrome Extension (Execution Layer)
3.  Web Interface (User Dashboard + Admin + Landing)

High-Level Flow:

User adds topic\
→ Backend scrapes posts\
→ Viral score calculation\
→ Category classification\
→ Topic filtering\
→ AI summary (if needed)\
→ AI draft generation\
→ Extension injects or auto replies\
→ Logging & analytics

------------------------------------------------------------------------

# 3. Database Structure

Tables:

users\
persona_profiles\
topics\
subscriptions\
scraped_posts\
viral_scores\
post_categories\
summaries\
drafts\
automation_rules\
auto_reply_rules\
ai_logs

Each table must include: - id - created_at - updated_at

------------------------------------------------------------------------

# 4. Feature 1 -- AI Assistant & Growth Engine

## Persona Engine

Input: - 100--500 historical tweets

Output: Compact JSON containing: - tone - avg_length - emoji_usage -
hook_style - cta_style

Persona is generated once and reused to reduce token cost.

------------------------------------------------------------------------

## Content Generator

Input: - Persona JSON - Summary - Category

Output: - 3 hook variations - 1 tweet draft - Optional thread

Must cache outputs for 6 hours.

------------------------------------------------------------------------

## Automation Engine

IF condition → action logic.

Examples: - IF likes \> 50 → suggest CTA - IF post older than 3 days &
viral → repost

No AI required here.

------------------------------------------------------------------------

# 5. Feature 2 -- Narrative & Viral Intelligence

## Data Collection

Runs every 5 minutes: - Scrape X search by keyword - Scrape selected KOL
timelines - Extract engagement metrics

No AI used in scraping.

------------------------------------------------------------------------

## Viral Score Engine

Formula:

(likes + 2 × reposts + replies)\
/ minutes_since_posted

Normalize by follower count.

Ignore: - Posts older than 24 hours - Low engagement posts

------------------------------------------------------------------------

## Category Engine

Categories:

1.  Breaking News\
2.  Narrative Shift\
3.  Opinion\
4.  Data / Research\
5.  Controversy\
6.  Meme

Layer 1: Rule-based\
Layer 2: Embedding similarity\
Layer 3: AI confirm if needed

------------------------------------------------------------------------

## AI Summary Trigger

AI is used ONLY when: - Viral score high - Category not Meme - Topic
match confirmed

AI generates: - 3--5 line summary - Impact explanation - Hook
suggestions

------------------------------------------------------------------------

# 6. Auto Reply Mode (Customizable)

## Extension Linking

User logs in on web\
→ Web generates Extension Token\
→ User connects extension\
→ Extension authenticates with backend

Token has expiration.

------------------------------------------------------------------------

## User Custom Rules

Trigger conditions may include: - Category match - Viral score
threshold - Topic match - Exclude Meme

Reply Modes: - Template - AI Persona - Hybrid

------------------------------------------------------------------------

## Anti-Ban Safety

-   Max replies per hour
-   Cooldown timer
-   No duplicate reply
-   Manual confirm default
-   Similarity check

------------------------------------------------------------------------

# 7. Chrome Extension Responsibilities

Extension handles:

-   DOM scraping
-   Sending raw data to backend
-   Injecting draft into composer
-   Executing auto reply safely

Extension does NOT call AI directly.

------------------------------------------------------------------------

# 8. User Dashboard

Pages:

Overview\
Topics\
Viral Feed\
Draft Studio\
Automation\
Settings

------------------------------------------------------------------------

# 9. Admin Dashboard

Admin features:

-   User metrics
-   Token usage tracking
-   Scraper health monitoring
-   AI call logs

------------------------------------------------------------------------

# 10. Landing Page

Hero: Turn X Into Your Narrative Weapon

Sections: - Problem - Solution - How It Works - Pricing - Call to Action

------------------------------------------------------------------------

# 11. Token Optimization Rules

AI MUST NOT be used for: - Scraping - Viral scoring - Rule
classification - Topic filtering

AI ONLY used for: - Persona creation - Summary generation - Draft
generation - Ambiguous classification

All AI calls must be logged and cached.

------------------------------------------------------------------------

# 12. MVP Scope

Include: - Topic subscription - Scraper - Viral scoring - 3 categories
(News / Opinion / Meme) - Basic summary - Persona-based draft
generation - Manual extension injection - Safe auto reply mode

Exclude: - Multi-account - Agency mode - Advanced narrative drift -
Aggressive automation

------------------------------------------------------------------------

# End of Document
