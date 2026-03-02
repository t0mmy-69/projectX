// Claude-powered Persona Engine - Analyzes writing style with AI

import { callClaude, isClaudeAvailable } from './claudeClient';
import { logTokenUsage } from './tokenTracking';
import { personaCache } from './cache';
import { analyzePersona as fallbackAnalyzePersona } from './personaEngine';
import { PersonaProfile } from './personaEngine';

export async function analyzePersonaWithClaude(
  userId: string,
  tweets: string[]
): Promise<PersonaProfile> {
  // Check cache first
  const cacheKey = `persona_${userId}`;
  const cached = personaCache.get(cacheKey) as PersonaProfile | null;
  if (cached) {
    console.log('[Persona] Using cached persona for', userId);
    return cached;
  }

  // Check if Claude is available
  const claudeAvailable = await isClaudeAvailable();
  if (!claudeAvailable) {
    console.warn('[Persona] Claude not available, using fallback rule-based analysis');
    return fallbackAnalyzePersona(tweets);
  }

  try {
    if (tweets.length === 0) {
      return fallbackAnalyzePersona([]);
    }

    const tweetSample = tweets.slice(0, 100).join('\n---\n');

    const prompt = `Analyze these ${tweets.length} tweets from a content creator and extract their writing persona.

Return JSON with exactly these fields:
{
  "tone": "professional" | "casual" | "sarcastic" | "inspirational",
  "avg_length": <number between 50 and 280>,
  "emoji_usage": <number 0-100 representing percentage>,
  "hook_style": "question" | "statement" | "thread" | "reference",
  "cta_style": "direct" | "subtle" | "none"
}

Focus on:
1. Tone: Overall writing voice (professional/casual/sarcastic/inspirational)
2. Avg Length: Average characters per tweet (estimate)
3. Emoji Usage: What percentage of tweets have emojis
4. Hook Style: How they typically start tweets
5. CTA Style: How they ask for engagement

Tweets:
${tweetSample}`;

    const response = await callClaude<PersonaProfile>(
      prompt,
      { max_tokens: 300 },
      true,
      3
    );

    // Validate response has required fields
    if (!response.tone || !response.hook_style || !response.cta_style) {
      console.warn('[Persona] Invalid response from Claude, using fallback');
      return fallbackAnalyzePersona(tweets);
    }

    // Cache the result
    personaCache.set(cacheKey, response);

    // Log token usage (estimate: input ~500-1000 tokens, output ~100 tokens)
    logTokenUsage(
      userId,
      'analyzePersonaWithClaude',
      Math.min(tweets.length * 10, 5000),
      150,
      'claude-opus-4-6',
      'success'
    );

    return response;
  } catch (error) {
    console.error('[Persona] Claude API error:', error);
    logTokenUsage(
      userId,
      'analyzePersonaWithClaude',
      0,
      0,
      'claude-opus-4-6',
      'error',
      String(error)
    );

    // Fallback to rule-based analysis
    return fallbackAnalyzePersona(tweets);
  }
}

export async function getOrCreatePersona(
  userId: string,
  tweets: string[]
): Promise<PersonaProfile> {
  // Try Claude first, fallback to rules
  return analyzePersonaWithClaude(userId, tweets);
}
