// Claude-powered Content Generator - Creates high-quality drafts with AI

import { callClaude, isClaudeAvailable } from './claudeClient';
import { logTokenUsage } from './tokenTracking';
import { draftCache } from './cache';
import { generateContent as fallbackGenerateContent, GeneratedContent } from './contentGenerator';
import { PersonaProfile } from './personaEngine';

export interface ContentGenerationInput {
  persona: PersonaProfile;
  summary: string;
  category: string;
  topic: string;
}

export async function generateContentWithClaude(
  userId: string,
  input: ContentGenerationInput
): Promise<GeneratedContent> {
  const cacheKey = `draft_${userId}_${input.topic}_${input.category}_${input.persona.tone}`;

  // Check cache first (6-hour TTL)
  const cached = draftCache.get(cacheKey) as GeneratedContent | null;
  if (cached) {
    console.log('[ContentGen] Using cached draft');
    return cached;
  }

  // Check if Claude is available
  const claudeAvailable = await isClaudeAvailable();
  if (!claudeAvailable) {
    console.warn('[ContentGen] Claude not available, using fallback');
    return fallbackGenerateContent(input);
  }

  try {
    const emojiAddition = input.persona.emoji_usage > 50 ? '🎯 ' : '';

    const prompt = `You are an expert Twitter content creator. Generate engaging tweet content for a creator with this persona:

PERSONA:
- Tone: ${input.persona.tone}
- Hook Style: ${input.persona.hook_style}
- CTA Style: ${input.persona.cta_style}
- Typical Length: ${input.persona.avg_length} chars
- Uses Emojis: ${input.persona.emoji_usage}% of the time

CONTEXT:
- Topic: ${input.topic}
- Category: ${input.category}
- Summary: ${input.summary}

Generate 3 UNIQUE hook variations (one-liners to grab attention):
1. Use the persona's hook style
2. Make them distinct from each other
3. Keep under 50 characters each

Then create:
- A complete tweet draft (max 280 chars) using the best hook
- Optional thread if this is a research/narrative topic

Return JSON:
{
  "hook_variation_1": "First hook variation",
  "hook_variation_2": "Second hook variation",
  "hook_variation_3": "Third hook variation",
  "tweet_draft": "Complete tweet draft with hook + body + CTA",
  "thread_draft": "Optional thread starting with 1/X format or null"
}`;

    const response = await callClaude<GeneratedContent>(
      prompt,
      { max_tokens: 1000 },
      true,
      3
    );

    // Validate response
    if (!response.hook_variation_1 || !response.tweet_draft) {
      console.warn('[ContentGen] Invalid response from Claude, using fallback');
      return fallbackGenerateContent(input);
    }

    // Cache the result (6 hours)
    draftCache.set(cacheKey, response);

    // Log token usage (estimate: input ~800 tokens, output ~400 tokens)
    logTokenUsage(
      userId,
      'generateContentWithClaude',
      800,
      400,
      'claude-opus-4-6',
      'success'
    );

    return response;
  } catch (error) {
    console.error('[ContentGen] Claude API error:', error);
    logTokenUsage(
      userId,
      'generateContentWithClaude',
      0,
      0,
      'claude-opus-4-6',
      'error',
      String(error)
    );

    // Fallback to rule-based generation
    return fallbackGenerateContent(input);
  }
}

export async function generateContent(
  userId: string,
  input: ContentGenerationInput
): Promise<GeneratedContent> {
  return generateContentWithClaude(userId, input);
}
