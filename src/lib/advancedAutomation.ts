// Advanced Automation Engine
// Handles complex automation rules: aggressive automation, smart replies, etc.

import { ScrapedPost } from './db';
import { callClaude } from './claudeClient';

export interface AdvancedAutomationRule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger: AdvancedTrigger;
  actions: AdvancedAction[];
  is_active: boolean;
  max_actions_per_hour: number;
  created_at: Date;
  updated_at: Date;
}

export interface AdvancedTrigger {
  type: 'narrative_emergence' | 'sentiment_spike' | 'viral_threshold' | 'controversy' | 'competitor_mention' | 'topic_keyword';
  conditions: Record<string, any>;
  min_confidence?: number; // 0-100
}

export interface AdvancedAction {
  type: 'auto_like' | 'auto_repost' | 'auto_reply' | 'auto_thread' | 'alert' | 'mention_list';
  config: {
    template?: string;
    min_engagement?: number;
    conditions?: Record<string, any>;
  };
}

/**
 * Evaluate if a post matches advanced trigger conditions
 */
export async function shouldTriggerAdvancedAutomation(
  post: ScrapedPost,
  rule: AdvancedAutomationRule,
  additionalContext?: {
    sentiment?: string;
    narrative?: string;
    engagement_velocity?: number;
  }
): Promise<{
  should_trigger: boolean;
  confidence: number;
  reason: string;
}> {
  const trigger = rule.trigger;

  switch (trigger.type) {
    case 'narrative_emergence':
      return evaluateNarrativeTrigger(post, trigger, additionalContext);

    case 'sentiment_spike':
      return evaluateSentimentTrigger(post, trigger, additionalContext);

    case 'viral_threshold':
      return evaluateViralTrigger(post, trigger);

    case 'controversy':
      return evaluateControversyTrigger(post, trigger);

    case 'competitor_mention':
      return evaluateCompetitorTrigger(post, trigger);

    case 'topic_keyword':
      return evaluateKeywordTrigger(post, trigger);

    default:
      return { should_trigger: false, confidence: 0, reason: 'Unknown trigger type' };
  }
}

async function evaluateNarrativeTrigger(
  post: ScrapedPost,
  trigger: AdvancedTrigger,
  context?: any
): Promise<{ should_trigger: boolean; confidence: number; reason: string }> {
  const keywords = trigger.conditions.keywords || [];
  const minConfidence = trigger.min_confidence || 50;

  const contentLower = post.content.toLowerCase();
  const keywordMatches = keywords.filter((kw: string) => contentLower.includes(kw.toLowerCase())).length;
  const confidence = (keywordMatches / keywords.length) * 100;

  return {
    should_trigger: confidence >= minConfidence,
    confidence,
    reason: `Matched ${keywordMatches}/${keywords.length} narrative keywords`,
  };
}

async function evaluateSentimentTrigger(
  post: ScrapedPost,
  trigger: AdvancedTrigger,
  context?: any
): Promise<{ should_trigger: boolean; confidence: number; reason: string }> {
  const targetSentiment = trigger.conditions.sentiment || 'negative';
  const minSpike = trigger.conditions.min_spike || 0.5;

  // Use context if provided, otherwise estimate
  const currentSentiment = context?.sentiment || 'neutral';
  const spikeDetected = currentSentiment === targetSentiment;

  return {
    should_trigger: spikeDetected,
    confidence: spikeDetected ? 75 : 25,
    reason: spikeDetected
      ? `Sentiment spike detected: ${targetSentiment}`
      : `No significant ${targetSentiment} sentiment detected`,
  };
}

async function evaluateViralTrigger(
  post: ScrapedPost,
  trigger: AdvancedTrigger
): Promise<{ should_trigger: boolean; confidence: number; reason: string }> {
  const threshold = trigger.conditions.viral_score_min || 50;
  const engagement = post.likes + post.reposts * 2 + post.replies;
  const estimatedViralScore = Math.min(engagement / 10, 100);

  return {
    should_trigger: estimatedViralScore >= threshold,
    confidence: 90,
    reason: `Viral score ${estimatedViralScore.toFixed(1)} ${estimatedViralScore >= threshold ? '≥' : '<'} ${threshold}`,
  };
}

async function evaluateControversyTrigger(
  post: ScrapedPost,
  trigger: AdvancedTrigger
): Promise<{ should_trigger: boolean; confidence: number; reason: string }> {
  const minControversy = trigger.conditions.min_controversy_score || 50;

  // High replies relative to likes = controversial
  const engagementRatio = post.replies / (post.likes + 1);
  const controversyScore = Math.min(engagementRatio * 50, 100);

  return {
    should_trigger: controversyScore >= minControversy,
    confidence: 70,
    reason: `Controversy score ${controversyScore.toFixed(0)}/100`,
  };
}

async function evaluateCompetitorTrigger(
  post: ScrapedPost,
  trigger: AdvancedTrigger
): Promise<{ should_trigger: boolean; confidence: number; reason: string }> {
  const competitors = trigger.conditions.competitor_handles || [];
  const contentLower = post.content.toLowerCase();

  const mentionedCompetitors = competitors.filter((comp: string) =>
    contentLower.includes(comp.toLowerCase())
  );

  return {
    should_trigger: mentionedCompetitors.length > 0,
    confidence: mentionedCompetitors.length > 0 ? 95 : 0,
    reason: mentionedCompetitors.length > 0
      ? `Mentioned ${mentionedCompetitors.join(', ')}`
      : 'No competitor mentions detected',
  };
}

async function evaluateKeywordTrigger(
  post: ScrapedPost,
  trigger: AdvancedTrigger
): Promise<{ should_trigger: boolean; confidence: number; reason: string }> {
  const keywords = trigger.conditions.keywords || [];
  const matchMode = trigger.conditions.match_mode || 'any'; // 'any' or 'all'

  const contentLower = post.content.toLowerCase();
  const matches = keywords.filter((kw: string) => contentLower.includes(kw.toLowerCase()));

  const shouldTrigger =
    matchMode === 'any' ? matches.length > 0 : matches.length === keywords.length;

  return {
    should_trigger: shouldTrigger,
    confidence: (matches.length / keywords.length) * 100,
    reason: `Matched ${matches.length}/${keywords.length} keywords: ${matches.join(', ')}`,
  };
}

/**
 * Generate aggressive automation response
 */
export async function generateAggressiveResponse(
  userId: string,
  post: ScrapedPost,
  action: AdvancedAction,
  persona?: { tone: string; avg_length: number }
): Promise<{
  response?: string;
  action_type: string;
  confidence: number;
  safe: boolean;
}> {
  if (action.type === 'auto_reply' || action.type === 'auto_thread') {
    // Use Claude to generate response matching persona
    const prompt = `Generate a ${action.type === 'auto_thread' ? 'thread' : 'reply'} to this post.
Tone: ${persona?.tone || 'professional'}
Max length: ${action.type === 'auto_thread' ? '500 chars per tweet' : '280 chars'}
Content: "${post.content.substring(0, 100)}..."

Make it engaging but not spammy. Return just the response text.`;

    try {
      const response = await callClaude<string>(prompt, { max_tokens: 500 });
      return {
        response: typeof response === 'string' ? response : String(response),
        action_type: action.type,
        confidence: 85,
        safe: true,
      };
    } catch {
      return {
        response: undefined,
        action_type: action.type,
        confidence: 0,
        safe: false,
      };
    }
  }

  return {
    action_type: action.type,
    confidence: 100,
    safe: true,
  };
}

/**
 * Rate limit check for aggressive actions
 */
export function checkRateLimit(
  actionsThisHour: number,
  maxActionsPerHour: number
): { allowed: boolean; remaining: number } {
  return {
    allowed: actionsThisHour < maxActionsPerHour,
    remaining: Math.max(0, maxActionsPerHour - actionsThisHour),
  };
}
