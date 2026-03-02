-- NarrativeOS PostgreSQL Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  x_user_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  subscription_tier VARCHAR(50) DEFAULT 'free', -- free, creator, agency
  is_active BOOLEAN DEFAULT true
);

-- Persona Profiles
CREATE TABLE IF NOT EXISTS persona_profiles (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tone VARCHAR(50) NOT NULL,
  avg_length INTEGER NOT NULL,
  emoji_usage INTEGER NOT NULL,
  hook_style VARCHAR(50) NOT NULL,
  cta_style VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Topics (keywords to track)
CREATE TABLE IF NOT EXISTS topics (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  keyword VARCHAR(255) NOT NULL,
  category_filter VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_keyword (keyword)
);

-- Scraped Posts
CREATE TABLE IF NOT EXISTS scraped_posts (
  id VARCHAR(50) PRIMARY KEY,
  topic_id VARCHAR(50) NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  author VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  reposts INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  posted_at TIMESTAMP NOT NULL,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_topic_id (topic_id),
  INDEX idx_posted_at (posted_at)
);

-- Viral Scores
CREATE TABLE IF NOT EXISTS viral_scores (
  id VARCHAR(50) PRIMARY KEY,
  post_id VARCHAR(50) NOT NULL REFERENCES scraped_posts(id) ON DELETE CASCADE,
  score DECIMAL(10, 2) NOT NULL,
  engagement_rate DECIMAL(10, 2),
  calculated_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id)
);

-- Post Categories
CREATE TABLE IF NOT EXISTS post_categories (
  id VARCHAR(50) PRIMARY KEY,
  post_id VARCHAR(50) NOT NULL REFERENCES scraped_posts(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- breaking_news, narrative_shift, opinion, data_research, controversy, meme
  confidence DECIMAL(5, 2) NOT NULL,
  method VARCHAR(50) DEFAULT 'rule-based', -- rule-based, claude
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id)
);

-- Summaries
CREATE TABLE IF NOT EXISTS summaries (
  id VARCHAR(50) PRIMARY KEY,
  post_id VARCHAR(50) NOT NULL REFERENCES scraped_posts(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  impact_explanation TEXT,
  hook_suggestions TEXT, -- JSON array
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drafts
CREATE TABLE IF NOT EXISTS drafts (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id VARCHAR(50) NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  hook_variation_1 TEXT NOT NULL,
  hook_variation_2 TEXT NOT NULL,
  hook_variation_3 TEXT NOT NULL,
  tweet_draft TEXT NOT NULL,
  thread_draft TEXT,
  based_on_post_id VARCHAR(50) REFERENCES scraped_posts(id) ON DELETE SET NULL,
  cache_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_topic_id (topic_id)
);

-- Automation Rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  condition_type VARCHAR(50) NOT NULL, -- viral_score, category_match, likes_threshold, age_threshold
  condition_value VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- suggest_cta, suggest_repost, auto_reply, notify
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
);

-- Auto-Reply Rules
CREATE TABLE IF NOT EXISTS auto_reply_rules (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trigger_category VARCHAR(100),
  trigger_viral_score_min DECIMAL(10, 2),
  trigger_topic_match BOOLEAN DEFAULT false,
  exclude_meme BOOLEAN DEFAULT true,
  reply_mode VARCHAR(50) NOT NULL, -- template, ai_persona, hybrid
  reply_template TEXT,
  max_replies_per_hour INTEGER DEFAULT 10,
  cooldown_minutes INTEGER DEFAULT 5,
  require_manual_confirm BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
);

-- AI Logs (for token tracking and cost analysis)
CREATE TABLE IF NOT EXISTS ai_logs (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_call_type VARCHAR(50) NOT NULL, -- persona_analysis, summary_generation, draft_generation, classification
  tokens_used INTEGER DEFAULT 0,
  cost DECIMAL(10, 6) DEFAULT 0,
  model VARCHAR(50) DEFAULT 'claude-opus-4-6',
  status VARCHAR(20) DEFAULT 'success', -- success, error
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Extension Tokens (for Chrome extension auth)
CREATE TABLE IF NOT EXISTS extension_tokens (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_token (token)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_topics_user_active ON topics(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_posts_viral_score ON scraped_posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_drafts_created ON drafts(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_user_date ON ai_logs(user_id, created_at);

-- Views for common queries
CREATE OR REPLACE VIEW user_token_usage AS
SELECT
  user_id,
  DATE(created_at) as date,
  SUM(tokens_used) as total_tokens,
  SUM(cost) as total_cost,
  COUNT(*) as call_count
FROM ai_logs
GROUP BY user_id, DATE(created_at);

CREATE OR REPLACE VIEW topic_viral_posts AS
SELECT
  t.id as topic_id,
  t.user_id,
  t.keyword,
  COUNT(sp.id) as post_count,
  AVG(vs.score) as avg_viral_score,
  MAX(vs.score) as max_viral_score
FROM topics t
LEFT JOIN scraped_posts sp ON t.id = sp.topic_id
LEFT JOIN viral_scores vs ON sp.id = vs.post_id
GROUP BY t.id, t.user_id, t.keyword;
