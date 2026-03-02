// Persona Engine - Analyzes historical tweets to create persona profile
// Input: 100-500 historical tweets
// Output: Compact JSON with tone, avg_length, emoji_usage, hook_style, cta_style

export interface PersonaProfile {
  tone: string; // e.g., 'professional', 'casual', 'sarcastic', 'inspirational'
  avg_length: number; // Average tweet length
  emoji_usage: number; // Percentage of tweets with emojis
  hook_style: string; // e.g., 'question', 'statement', 'thread', 'reference'
  cta_style: string; // Call-to-action style: 'direct', 'subtle', 'none'
}

export function analyzePersona(tweets: string[]): PersonaProfile {
  if (tweets.length === 0) {
    return getDefaultPersona();
  }

  const lengths = tweets.map(t => t.length);
  const avgLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);

  const emojiCount = tweets.filter(t => hasEmoji(t)).length;
  const emojiUsage = Math.round((emojiCount / tweets.length) * 100);

  const tone = analyzeTone(tweets);
  const hookStyle = analyzeHookStyle(tweets);
  const ctaStyle = analyzeCtaStyle(tweets);

  return {
    tone,
    avg_length: avgLength,
    emoji_usage: emojiUsage,
    hook_style: hookStyle,
    cta_style: ctaStyle
  };
}

function hasEmoji(text: string): boolean {
  // Check for emoji Unicode ranges
  const emojiRegex = /[\p{Emoji}]/gu;
  return emojiRegex.test(text);
}

function analyzeTone(tweets: string[]): string {
  let professionalScore = 0;
  let casualScore = 0;
  let sarcasticScore = 0;
  let inspirationalScore = 0;

  const tonePatterns = {
    professional: ['implement', 'analysis', 'framework', 'strategy', 'insights'],
    casual: ['lol', 'haha', 'btw', 'imo', 'ngl', 'literally'],
    sarcastic: ['obviously', 'right?', 'sure', 'yeah right', 'great job'],
    inspirational: ['believe', 'dream', 'possible', 'never give up', 'inspired']
  };

  for (const tweet of tweets) {
    const lower = tweet.toLowerCase();
    professionalScore += countMatches(lower, tonePatterns.professional);
    casualScore += countMatches(lower, tonePatterns.casual);
    sarcasticScore += countMatches(lower, tonePatterns.sarcastic);
    inspirationalScore += countMatches(lower, tonePatterns.inspirational);
  }

  const scores = {
    professional: professionalScore,
    casual: casualScore,
    sarcastic: sarcasticScore,
    inspirational: inspirationalScore
  };

  return Object.entries(scores).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

function analyzeHookStyle(tweets: string[]): string {
  let questionCount = 0;
  let threadCount = 0;
  let referenceCount = 0;

  for (const tweet of tweets) {
    if (tweet.includes('?')) questionCount++;
    if (tweet.includes('1/') || tweet.includes('thread')) threadCount++;
    if (tweet.match(/via|source|link|check out/i)) referenceCount++;
  }

  const styles = {
    question: questionCount,
    thread: threadCount,
    reference: referenceCount,
    statement: tweets.length - questionCount - threadCount
  };

  return Object.entries(styles).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

function analyzeCtaStyle(tweets: string[]): string {
  let directCount = 0;
  let subtleCount = 0;

  const directCTA = ['click', 'read', 'follow', 'subscribe', 'join', 'check out'];
  const subtleCTA = ['interested', 'thoughts', 'agree', 'what do you think'];

  for (const tweet of tweets) {
    const lower = tweet.toLowerCase();
    directCount += countMatches(lower, directCTA);
    subtleCount += countMatches(lower, subtleCTA);
  }

  if (directCount > subtleCount) return 'direct';
  if (subtleCount > 0) return 'subtle';
  return 'none';
}

function countMatches(text: string, patterns: string[]): number {
  return patterns.filter(p => text.includes(p)).length;
}

function getDefaultPersona(): PersonaProfile {
  return {
    tone: 'professional',
    avg_length: 280,
    emoji_usage: 30,
    hook_style: 'question',
    cta_style: 'subtle'
  };
}
