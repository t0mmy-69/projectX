// Narrative Detection Engine
// Identifies narrative shifts and detects when posts form coherent narratives

import { callClaude } from './claudeClient';
import { Cache } from './cache';

// Create a dedicated narrative cache (4-hour TTL)
const narrativeCache = new Cache<any>('narrative', 240);

export interface Narrative {
  id: string;
  title: string;
  description: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  posts: string[]; // post IDs
  participants: string[]; // authors/accounts
  consensus: number; // 0-100 indicating agreement level
  trending_direction: 'rising' | 'stable' | 'declining';
  confidence: number;
  related_topics: string[];
  duration_hours: number;
  created_at: Date;
}

export interface NarrativeShift {
  id: string;
  from_narrative: string;
  to_narrative: string;
  trigger_post_id: string;
  shift_intensity: number; // 0-100
  affected_accounts: number;
  timestamp: Date;
}

/**
 * Detect narratives from a set of posts
 * Uses Claude to identify narrative threads
 */
export async function detectNarratives(
  userId: string,
  posts: Array<{ id: string; content: string; author: string; likes: number }>
): Promise<Narrative[]> {
  if (!posts || posts.length < 3) {
    return [];
  }

  // Check cache first
  const cacheKey = `narratives_${userId}_${posts.map(p => p.id).join('_')}`;
  const cached = narrativeCache.get(cacheKey) as Narrative[] | null;
  if (cached) {
    return cached;
  }

  try {
    // Prepare content for Claude
    const postsText = posts
      .map(p => `- @${p.author} (${p.likes} likes): "${p.content.substring(0, 100)}..."`)
      .join('\n');

    const prompt = `Analyze these tweets and identify up to 5 coherent narratives or themes. For each narrative, provide:
1. Title (3-5 words)
2. Description (1-2 sentences)
3. Sentiment (positive/neutral/negative/mixed)
4. Which tweets are part of this narrative (by index)
5. Consensus level (0-100) - how much agreement is there
6. Trending direction (rising/stable/declining)
7. Confidence (0-100) - how sure you are this is a real narrative
8. Related topics/keywords

Tweets:
${postsText}

Return as JSON array of narratives.`;

    const response = await callClaude<any>(prompt, { max_tokens: 1000 });

    // Parse response
    let narrativesData;
    try {
      if (typeof response === 'string') {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        narrativesData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } else if (Array.isArray(response)) {
        narrativesData = response;
      } else {
        narrativesData = [];
      }
    } catch {
      narrativesData = [];
    }

    // Transform to Narrative objects
    const narratives: Narrative[] = narrativesData.map((n: any) => ({
      id: `narrative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: n.title || 'Unknown Narrative',
      description: n.description || '',
      sentiment: n.sentiment || 'neutral',
      posts: n.post_indices?.map((idx: number) => posts[idx]?.id).filter(Boolean) || [],
      participants: n.participant_indices?.map((idx: number) => posts[idx]?.author).filter(Boolean) || [],
      consensus: n.consensus || 50,
      trending_direction: n.trending_direction || 'stable',
      confidence: n.confidence || 0,
      related_topics: n.related_topics || [],
      duration_hours: n.duration_hours || 1,
      created_at: new Date(),
    }));

    // Cache results
    narrativeCache.set(cacheKey, narratives);

    return narratives;
  } catch (error) {
    console.error('[Narrative] Detection error:', error);
    return detectNarrativesRuleBased(posts);
  }
}

/**
 * Fallback rule-based narrative detection
 */
function detectNarrativesRuleBased(
  posts: Array<{ id: string; content: string; author: string; likes: number }>
): Narrative[] {
  const narratives: Narrative[] = [];

  // Simple keyword clustering
  const keywords = ['breaking', 'urgent', 'announcement', 'update', 'trend', 'news', 'alert'];
  const contentLower = posts.map(p => p.content.toLowerCase());

  for (const keyword of keywords) {
    const matchingPosts = posts.filter((_, i) => contentLower[i].includes(keyword));
    if (matchingPosts.length >= 2) {
      narratives.push({
        id: `narrative_${Date.now()}_${keyword}`,
        title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Discussion`,
        description: `Posts discussing ${keyword}`,
        sentiment: 'neutral',
        posts: matchingPosts.map(p => p.id),
        participants: matchingPosts.map(p => p.author),
        consensus: 50,
        trending_direction: 'stable',
        confidence: 40, // Low confidence for rule-based
        related_topics: [keyword],
        duration_hours: 1,
        created_at: new Date(),
      });
    }
  }

  return narratives;
}

/**
 * Detect narrative shifts between time periods
 */
export async function detectNarrativeShifts(
  userId: string,
  previousNarratives: Narrative[],
  currentNarratives: Narrative[],
  triggerPost: { id: string; content: string }
): Promise<NarrativeShift[]> {
  if (previousNarratives.length === 0 || currentNarratives.length === 0) {
    return [];
  }

  const shifts: NarrativeShift[] = [];

  // Detect sentiment flips
  for (const prev of previousNarratives) {
    const current = currentNarratives.find(
      n => n.title.toLowerCase() === prev.title.toLowerCase()
    );

    if (current && prev.sentiment !== current.sentiment) {
      shifts.push({
        id: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from_narrative: prev.id,
        to_narrative: current.id,
        trigger_post_id: triggerPost.id,
        shift_intensity: Math.abs(prev.consensus - current.consensus),
        affected_accounts: current.participants.length,
        timestamp: new Date(),
      });
    }
  }

  // Detect new narratives (emergence)
  for (const curr of currentNarratives) {
    const prevExists = previousNarratives.find(
      p => p.title.toLowerCase() === curr.title.toLowerCase()
    );
    if (!prevExists && curr.confidence > 60) {
      shifts.push({
        id: `shift_${Date.now()}_emergence_${Math.random().toString(36).substr(2, 9)}`,
        from_narrative: 'none',
        to_narrative: curr.id,
        trigger_post_id: triggerPost.id,
        shift_intensity: curr.confidence,
        affected_accounts: curr.participants.length,
        timestamp: new Date(),
      });
    }
  }

  return shifts;
}

/**
 * Get narrative consensus score
 * Returns sentiment distribution across participants
 */
export function getNarrativeConsensus(narrative: Narrative): {
  agreement: number;
  disagreement: number;
  neutral: number;
} {
  const neutral = Math.max(100 - narrative.consensus - (100 - narrative.consensus) / 2, 0);
  const agreement = narrative.consensus;
  const disagreement = 100 - agreement - neutral;
  return {
    agreement: Math.round(agreement),
    disagreement: Math.round(Math.max(disagreement, 0)),
    neutral: Math.round(neutral),
  };
}
