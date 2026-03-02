// Claude-powered Summary Generation

import { callClaude, isClaudeAvailable } from './claudeClient';
import { logTokenUsage } from './tokenTracking';
import { summaryCache } from './cache';

export interface GeneratedSummary {
  summary_text: string;
  impact_explanation: string;
  hook_suggestions: string[];
}

export async function generateSummary(
  userId: string,
  postContent: string,
  category: string,
  viralScore: number
): Promise<GeneratedSummary> {
  // Check cache
  const cacheKey = `summary_${postContent.substring(0, 50)}_${category}`;
  const cached = summaryCache.get(cacheKey) as GeneratedSummary | null;
  if (cached) {
    return cached;
  }

  // Check if Claude is available
  const claudeAvailable = await isClaudeAvailable();
  if (!claudeAvailable) {
    // Return basic fallback
    return {
      summary_text: postContent.substring(0, 100) + '...',
      impact_explanation: `${category} post with viral score ${viralScore.toFixed(1)}`,
      hook_suggestions: ['Interesting take', 'Worth reading', 'Check this out']
    };
  }

  try {
    const prompt = `Summarize this viral ${category} Twitter post and suggest reply hooks.

Post:
"${postContent}"

Viral Score: ${viralScore.toFixed(1)} (0-100 scale)
Category: ${category}

Provide:
1. 3-5 line summary of the post's main point
2. Impact explanation (1 sentence) - why this matters
3. 3 hook suggestions for replies

Return JSON:
{
  "summary_text": "3-5 line summary",
  "impact_explanation": "One sentence explaining why this matters",
  "hook_suggestions": ["Hook 1", "Hook 2", "Hook 3"]
}`;

    const response = await callClaude<GeneratedSummary>(
      prompt,
      { max_tokens: 500 },
      true,
      2
    );

    summaryCache.set(cacheKey, response);

    logTokenUsage(
      userId,
      'generateSummary',
      500,
      250,
      'claude-opus-4-6',
      'success'
    );

    return response;
  } catch (error) {
    console.error('[Summary] Claude API error:', error);
    logTokenUsage(
      userId,
      'generateSummary',
      0,
      0,
      'claude-opus-4-6',
      'error',
      String(error)
    );

    // Return fallback
    return {
      summary_text: postContent.substring(0, 100) + '...',
      impact_explanation: `${category} post gaining traction`,
      hook_suggestions: ['Interesting point', 'Great analysis', 'Worth your time']
    };
  }
}
