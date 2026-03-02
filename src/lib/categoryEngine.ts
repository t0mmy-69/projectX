// Category Engine - Rule-based classification (Layer 1)
// Categories: Breaking News, Narrative Shift, Opinion, Data/Research, Controversy, Meme

export type PostCategory =
  | 'breaking_news'
  | 'narrative_shift'
  | 'opinion'
  | 'data_research'
  | 'controversy'
  | 'meme';

interface ClassificationResult {
  category: PostCategory;
  confidence: number;
  reason: string;
}

// Keywords for rule-based classification
const KEYWORDS = {
  breaking_news: [
    'breaking', 'just in', 'developing', 'just happened', 'alert',
    'urgent', 'happening now', 'live', 'exclusive', 'first to report'
  ],
  narrative_shift: [
    'shift', 'changed', 'pivot', 'new direction', 'turning point',
    'plot twist', 'unexpected', 'surprising', 'no one saw this coming'
  ],
  opinion: [
    'imho', 'imo', 'i think', 'i believe', 'my take', 'unpopular opinion',
    'hear me out', 'controversial take', 'everyone\'s wrong', 'actually'
  ],
  data_research: [
    'data', 'research', 'study', 'analysis', 'report', 'chart',
    'graph', 'statistics', 'findings', 'metrics', 'benchmark'
  ],
  controversy: [
    'controversy', 'scandal', 'drama', 'backlash', 'outrage',
    'called out', 'exposed', 'controversial', 'problematic', 'gets ratio\'d'
  ],
  meme: [
    'lol', 'haha', '😂', '🤣', 'meme', 'joke', 'funny', 'literally me',
    'no cap', 'fr fr', 'deadass', 'sus'
  ]
};

export function classifyPost(content: string): ClassificationResult {
  const lowerContent = content.toLowerCase();

  // Check for meme category first (more distinctive)
  const memeScore = calculateKeywordMatches(lowerContent, KEYWORDS.meme);
  if (memeScore >= 2) {
    return {
      category: 'meme',
      confidence: Math.min(100, memeScore * 25),
      reason: 'Meme keywords detected'
    };
  }

  // Check other categories
  const scores = {
    breaking_news: calculateKeywordMatches(lowerContent, KEYWORDS.breaking_news),
    narrative_shift: calculateKeywordMatches(lowerContent, KEYWORDS.narrative_shift),
    opinion: calculateKeywordMatches(lowerContent, KEYWORDS.opinion),
    data_research: calculateKeywordMatches(lowerContent, KEYWORDS.data_research),
    controversy: calculateKeywordMatches(lowerContent, KEYWORDS.controversy),
  };

  // Find category with highest score
  let maxCategory: PostCategory = 'opinion'; // Default fallback
  let maxScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxCategory = category as PostCategory;
    }
  }

  // If no clear category, default to opinion
  if (maxScore === 0) {
    return {
      category: 'opinion',
      confidence: 40,
      reason: 'Default classification'
    };
  }

  return {
    category: maxCategory,
    confidence: Math.min(100, maxScore * 25),
    reason: `Matches ${maxCategory.replace('_', ' ')} pattern`
  };
}

function calculateKeywordMatches(text: string, keywords: string[]): number {
  let count = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      count++;
    }
  }
  return count;
}

export function isMemePost(content: string): boolean {
  const result = classifyPost(content);
  return result.category === 'meme';
}

export function shouldSummarize(viralScore: number, category: PostCategory): boolean {
  // Only summarize if:
  // - Viral score is high (> 50)
  // - Category is not Meme
  // - Topic match confirmed (handled elsewhere)

  return viralScore > 50 && category !== 'meme';
}
