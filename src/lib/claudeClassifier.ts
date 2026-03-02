// Claude-powered Classifier (Layer 2/3) - Advanced classification when rule-based is ambiguous

import { callClaude, isClaudeAvailable } from './claudeClient';
import { logTokenUsage } from './tokenTracking';
import { classificationCache } from './cache';
import { classifyPost as ruleBasedClassify, PostCategory } from './categoryEngine';

export interface ClassificationResult {
  category: PostCategory;
  confidence: number;
  reason: string;
  method: 'rule-based' | 'claude';
}

export async function classifyPostWithClaude(
  userId: string,
  content: string,
  ruleBasedConfidence: number = 0
): Promise<ClassificationResult> {
  // Always try rule-based first (fast)
  const ruleResult = ruleBasedClassify(content);

  // If confidence is high, return immediately
  if (ruleResult.confidence > 70) {
    return {
      ...ruleResult,
      method: 'rule-based'
    };
  }

  // Check cache
  const cacheKey = `classify_${content.substring(0, 50)}`;
  const cached = classificationCache.get(cacheKey) as ClassificationResult | null;
  if (cached) {
    return cached;
  }

  // Check if Claude is available for Layer 2 classification
  const claudeAvailable = await isClaudeAvailable();
  if (!claudeAvailable) {
    return {
      ...ruleResult,
      method: 'rule-based',
      reason: 'Claude not available, using rule-based fallback'
    };
  }

  try {
    const prompt = `Classify this Twitter post into exactly ONE category:

Categories:
- breaking_news: News, announcements, urgent updates
- narrative_shift: Major shifts in thinking, plot twists, surprising takes
- opinion: Personal commentary, perspectives, takes
- data_research: Data, studies, analysis, research findings
- controversy: Drama, backlash, outrage, scandals
- meme: Jokes, humor, funny content

Post:
"${content}"

Return JSON:
{
  "category": "breaking_news" | "narrative_shift" | "opinion" | "data_research" | "controversy" | "meme",
  "confidence": 0-100,
  "reason": "Brief explanation"
}`;

    const response = await callClaude<{
      category: PostCategory;
      confidence: number;
      reason: string;
    }>(
      prompt,
      { max_tokens: 200 },
      true,
      2
    );

    const result: ClassificationResult = {
      category: response.category,
      confidence: response.confidence,
      reason: response.reason,
      method: 'claude'
    };

    classificationCache.set(cacheKey, result);

    logTokenUsage(
      userId,
      'classifyPostWithClaude',
      300,
      100,
      'claude-opus-4-6',
      'success'
    );

    return result;
  } catch (error) {
    console.error('[Classifier] Claude API error:', error);
    logTokenUsage(
      userId,
      'classifyPostWithClaude',
      0,
      0,
      'claude-opus-4-6',
      'error',
      String(error)
    );

    // Return rule-based result on error
    return {
      ...ruleResult,
      method: 'rule-based',
      reason: `Claude error, using rule-based: ${ruleResult.reason}`
    };
  }
}

export async function classifyPost(
  userId: string,
  content: string
): Promise<ClassificationResult> {
  return classifyPostWithClaude(userId, content);
}
