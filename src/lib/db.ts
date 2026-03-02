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
  userAccounts: new Map<string, UserAccount>(),
  teams: new Map<string, Team>(),
  teamMembers: new Map<string, TeamMember>(),
  workspaces: new Map<string, Workspace>(),
};

// Persist across hot-reloads in development
if (!global.__narrativeOS_db) {
  global.__narrativeOS_db = _memoryDB;
}

export const memoryDB = global.__narrativeOS_db;
