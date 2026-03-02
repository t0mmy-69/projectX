// Database schema and models for NarrativeOS

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  x_user_id?: string;
  x_username?: string;
  x_access_token?: string;
  x_refresh_token?: string;
  x_token_expires_at?: Date;
  tracked_kols?: string[];
  subscription_tier: 'free' | 'creator' | 'agency';
  created_at: Date;
  updated_at: Date;
}

export interface PersonaProfile {
  id: string;
  user_id: string;
  tone: string;
  avg_length: number;
  emoji_usage: number;
  hook_style: string;
  cta_style: string;
  created_at: Date;
  updated_at: Date;
}

export interface Topic {
  id: string;
  user_id: string;
  keyword: string;
  category_filter?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ScrapedPost {
  id: string;
  topic_id: string;
  author: string;
  content: string;
  likes: number;
  reposts: number;
  replies: number;
  posted_at: Date;
  scraped_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ViralScore {
  id: string;
  post_id: string;
  score: number;
  engagement_rate: number;
  calculated_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PostCategory {
  id: string;
  post_id: string;
  category: 'breaking_news' | 'narrative_shift' | 'opinion' | 'data_research' | 'controversy' | 'meme';
  confidence: number;
  created_at: Date;
  updated_at: Date;
}

export interface Summary {
  id: string;
  post_id: string;
  summary_text: string;
  impact_explanation: string;
  hook_suggestions: string[];
  tokens_used: number;
  created_at: Date;
  updated_at: Date;
}

export interface Draft {
  id: string;
  user_id: string;
  topic_id: string;
  hook_variation_1: string;
  hook_variation_2: string;
  hook_variation_3: string;
  tweet_draft: string;
  thread_draft?: string;
  based_on_post_id?: string;
  cache_expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AutomationRule {
  id: string;
  user_id: string;
  condition_type: 'viral_score' | 'category_match' | 'likes_threshold' | 'age_threshold';
  condition_value: string;
  action_type: 'suggest_cta' | 'suggest_repost' | 'auto_reply' | 'notify';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AutoReplyRule {
  id: string;
  user_id: string;
  trigger_category?: string;
  trigger_viral_score_min?: number;
  trigger_topic_match?: boolean;
  exclude_meme?: boolean;
  reply_mode: 'template' | 'ai_persona' | 'hybrid';
  reply_template?: string;
  max_replies_per_hour: number;
  cooldown_minutes: number;
  require_manual_confirm: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AILog {
  id: string;
  user_id: string;
  api_call_type: 'persona_analysis' | 'summary_generation' | 'draft_generation' | 'classification';
  tokens_used: number;
  cost: number;
  created_at: Date;
  updated_at: Date;
}

export interface ExtensionToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ReplyLog {
  id: string;
  user_id: string;
  post_id: string;
  reply_text: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserAccount {
  id: string;
  user_id: string;
  x_user_id: string;
  x_username: string;
  x_access_token: string;
  x_refresh_token?: string;
  x_token_expires_at: Date;
  is_primary: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'admin' | 'editor' | 'viewer';
  joined_at: Date;
}

export interface Workspace {
  id: string;
  team_id: string;
  name: string;
  description?: string;
  owner_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ─── Agent System ───────────────────────────────────────────────────────────

export type LLMProvider = 'claude' | 'openai' | 'grok' | 'gemini' | 'deepseek';
export type AgentTone = 'professional' | 'casual' | 'witty' | 'provocative' | 'educational';

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  prompt: string;            // Custom system prompt / personality
  tone: AgentTone;
  topics: string[];          // Keywords to match posts against
  reply_style: string;       // e.g. "Short punchy replies", "Ask questions"
  llm_provider: LLMProvider;
  llm_model: string;         // e.g. "claude-3-5-haiku-20241022"
  auto_mode: boolean;        // true = auto-post, false = show preview first
  max_replies_hour: number;
  min_viral_score: number;   // 0 = reply to any post
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AgentDecision {
  id: string;
  agent_id: string;
  user_id: string;
  post_text: string;
  post_author: string;
  post_url?: string;
  reply_text: string;
  tokens_used: number;
  llm_provider: string;
  llm_model: string;
  was_auto_posted: boolean;
  created_at: Date;
}

export interface UserLLMKey {
  id: string;
  user_id: string;
  provider: LLMProvider;
  api_key: string;           // In production: encrypted at rest
  created_at: Date;
  updated_at: Date;
}

// In-memory storage for MVP (will be replaced with real DB)
// Use global singleton to persist across Next.js hot-reloads in dev mode
declare global {
  // eslint-disable-next-line no-var
  var __narrativeOS_db: typeof _memoryDB | undefined;
}

const _memoryDB = {
  users: new Map<string, User>(),
  usersByEmail: new Map<string, string>(), // email -> user_id index for fast lookup
  personas: new Map<string, PersonaProfile>(),
  topics: new Map<string, Topic>(),
  posts: new Map<string, ScrapedPost>(),
  viralScores: new Map<string, ViralScore>(),
  categories: new Map<string, PostCategory>(),
  summaries: new Map<string, Summary>(),
  drafts: new Map<string, Draft>(),
  automationRules: new Map<string, AutomationRule>(),
  autoReplyRules: new Map<string, AutoReplyRule>(),
  aiLogs: new Map<string, AILog>(),
  extensionTokens: new Map<string, ExtensionToken>(),
  replyLogs: new Map<string, ReplyLog>(),
  userAccounts: new Map<string, UserAccount>(),
  teams: new Map<string, Team>(),
  teamMembers: new Map<string, TeamMember>(),
  workspaces: new Map<string, Workspace>(),
  // Agent system
  agents: new Map<string, Agent>(),
  agentDecisions: new Map<string, AgentDecision>(),
  userLLMKeys: new Map<string, UserLLMKey>(),         // key: `${userId}_${provider}`
};

// Persist across hot-reloads in development
if (!global.__narrativeOS_db) {
  global.__narrativeOS_db = _memoryDB;
}

export const memoryDB = global.__narrativeOS_db;

// ─── Seed demo data on every cold start ───────────────────────────────────────
// Runs at module load time → every serverless instance gets demo data pre-loaded
// This makes the demo account work reliably on Vercel (stateless serverless)
(function seedDemoData() {
  // Always seed demo data — in-memory DB needs this on every cold start (Vercel serverless)

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto') as typeof import('crypto');

  const DEMO_USER_ID = 'demo_user_001';
  const DEMO_EMAIL   = 'demo@narrativeos.app';
  // Fixed salt → deterministic hash → login works across all serverless instances
  const DEMO_SALT    = 'narrativeos_demo_fixed_salt_v1';
  const DEMO_HASH    = crypto.pbkdf2Sync('demo1234', DEMO_SALT, 1000, 64, 'sha512').toString('hex');
  const now          = new Date();

  // Demo user — always set so hash stays consistent
  memoryDB.users.set(DEMO_USER_ID, {
    id: DEMO_USER_ID,
    email: DEMO_EMAIL,
    name: 'Demo User',
    password_hash: `${DEMO_SALT}:${DEMO_HASH}`,
    subscription_tier: 'creator',
    created_at: now,
    updated_at: now,
  } as User & { password_hash: string });
  memoryDB.usersByEmail.set(DEMO_EMAIL, DEMO_USER_ID);

  // Demo topics
  ['AI Tech & Agents', 'Solana DeFi', 'SaaS Growth'].forEach((kw, i) => {
    const id = `demo_topic_${i}`;
    if (!memoryDB.topics.has(id)) {
      memoryDB.topics.set(id, {
        id, user_id: DEMO_USER_ID, keyword: kw,
        is_active: true, created_at: now, updated_at: now,
      });
    }
  });

  // Demo posts + viral scores + categories
  const demoPosts = [
    {
      author: 'paulg', likes: 12000, reposts: 3400, replies: 1200,
      category: 'opinion' as PostCategory['category'],
      content: 'The best startups of the next decade will be built by solo founders with AI as their cofounder.',
    },
    {
      author: 'naval', likes: 8900, reposts: 2100, replies: 560,
      category: 'opinion' as PostCategory['category'],
      content: 'Specific knowledge cannot be taught. It can only be learned through genuine curiosity and obsession.',
    },
    {
      author: 'VitalikButerin', likes: 4200, reposts: 890, replies: 340,
      category: 'narrative_shift' as PostCategory['category'],
      content: 'The next wave of Layer 2 solutions will focus on ZK-proofs for everything. Privacy is the killer feature.',
    },
  ];

  demoPosts.forEach((p, i) => {
    const postId   = `demo_post_${i}`;
    if (!memoryDB.posts.has(postId)) {
      const postedAt = new Date(now.getTime() - (i + 1) * 30 * 60_000);
      const score    = (p.likes + 2 * p.reposts + p.replies) / 60;

      memoryDB.posts.set(postId, {
        id: postId, topic_id: 'demo_topic_0',
        author: p.author, content: p.content,
        likes: p.likes, reposts: p.reposts, replies: p.replies,
        posted_at: postedAt, scraped_at: now, created_at: now, updated_at: now,
      });

      memoryDB.viralScores.set(postId, {
        id: `vs_${postId}`, post_id: postId,
        score, engagement_rate: score / 100,
        calculated_at: now, created_at: now, updated_at: now,
      });

      memoryDB.categories.set(`cat_${postId}`, {
        id: `cat_${postId}`, post_id: postId,
        category: p.category, confidence: 0.9,
        created_at: now, updated_at: now,
      });
    }
  });

  // Demo agent — "Thought Leader" persona
  if (!memoryDB.agents.has('demo_agent_001')) {
    memoryDB.agents.set('demo_agent_001', {
      id: 'demo_agent_001',
      user_id: DEMO_USER_ID,
      name: 'Thought Leader',
      description: 'Engages with AI, tech, and startup content with sharp insights',
      prompt: 'You are a seasoned tech entrepreneur and thought leader. You\'ve built multiple startups, invest in AI, and have strong opinions on the future of technology. You engage authentically, challenge conventional wisdom, and always add value.',
      tone: 'professional',
      topics: ['AI', 'startup', 'founder', 'tech', 'agent', 'LLM', 'SaaS'],
      reply_style: 'Sharp, punchy insights. 1-2 sentences max. No emojis.',
      llm_provider: 'claude',
      llm_model: 'claude-3-5-haiku-20241022',
      auto_mode: false,
      max_replies_hour: 5,
      min_viral_score: 0,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
  }
})();
