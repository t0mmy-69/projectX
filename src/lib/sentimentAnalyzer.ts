// Sentiment Analysis Engine
// Analyzes emotional tone and sentiment of posts and conversations

import { callClaude } from './claudeClient';
import { Cache } from './cache';

// Create a dedicated sentiment cache (4-hour TTL)
const sentimentCache = new Cache<any>('sentiment', 240);

export type SentimentType = 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
export type EmotionType = 'excitement' | 'anger' | 'fear' | 'disappointment' | 'hope' | 'curiosity' | 'neutral';

export interface PostSentiment {
  post_id: string;
  sentiment: SentimentType;
  score: number; // -1 to 1
  emotions: {
    emotion: EmotionType;
    intensity: number; // 0-100
  }[];
  polarity_shifts: number; // How many times sentiment changes in post
  confidence: number; // 0-100
}

export interface ConversationSentiment {
  posts: PostSentiment[];
  overall_sentiment: SentimentType;
  average_score: number;
  dominant_emotion: EmotionType;
  sentiment_trend: 'improving' | 'declining' | 'stable';
  polarization_index: number; // 0-100, high = very polarized
  controversy_score: number; // 0-100, high = controversial
}

/**
 * Analyze sentiment of a single post
 */
export async function analyzePostSentiment(
  userId: string,
  postId: string,
  content: string
): Promise<PostSentiment> {
  // Check cache
  const cacheKey = `sentiment_${postId}`;
  const cached = sentimentCache.get(cacheKey) as PostSentiment | null;
  if (cached) {
    return cached;
  }

  try {
    const prompt = `Analyze the sentiment and emotions in this tweet:
"${content}"

Provide:
1. Overall sentiment (very_positive, positive, neutral, negative, very_negative)
2. Sentiment score (-1 to 1)
3. Dominant emotions (list up to 3 with intensity 0-100)
4. Number of sentiment shifts/contradictions (0-5)
5. Confidence in analysis (0-100)

Return as JSON only.`;

    const response = await callClaude<any>(prompt, { max_tokens: 500 });

    // Parse response
    let analysisData;
    try {
      if (typeof response === 'string') {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        analysisData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } else {
        analysisData = response;
      }
    } catch {
      return analyzePostSentimentRuleBased(postId, content);
    }

    const sentiment: PostSentiment = {
      post_id: postId,
      sentiment: analysisData.sentiment || 'neutral',
      score: analysisData.sentiment_score || 0,
      emotions: analysisData.emotions || [],
      polarity_shifts: analysisData.polarity_shifts || 0,
      confidence: analysisData.confidence || 50,
    };

    // Cache for 6 hours
    sentimentCache.set(cacheKey, sentiment);
    return sentiment;
  } catch (error) {
    console.error('[Sentiment] Analysis error:', error);
    return analyzePostSentimentRuleBased(postId, content);
  }
}

/**
 * Rule-based sentiment analysis fallback
 */
function analyzePostSentimentRuleBased(postId: string, content: string): PostSentiment {
  const lower = content.toLowerCase();

  // Simple keyword matching
  const positiveWords = ['great', 'awesome', 'love', 'excellent', 'amazing', 'best', 'brilliant', '😍', '🎉', '✨'];
  const negativeWords = ['hate', 'awful', 'worst', 'terrible', 'bad', 'useless', '😠', '😡', '🤦'];

  const positiveCount = positiveWords.filter(w => lower.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lower.includes(w)).length;

  let sentiment: SentimentType = 'neutral';
  let score = 0;

  if (positiveCount > negativeCount) {
    if (positiveCount > 2) {
      sentiment = 'very_positive';
      score = 1;
    } else {
      sentiment = 'positive';
      score = 0.5;
    }
  } else if (negativeCount > positiveCount) {
    if (negativeCount > 2) {
      sentiment = 'very_negative';
      score = -1;
    } else {
      sentiment = 'negative';
      score = -0.5;
    }
  }

  return {
    post_id: postId,
    sentiment,
    score,
    emotions: [],
    polarity_shifts: 0,
    confidence: Math.min((positiveCount + negativeCount) * 20, 100),
  };
}

/**
 * Analyze sentiment of a conversation
 */
export async function analyzeConversationSentiment(
  posts: Array<{ id: string; content: string }>
): Promise<ConversationSentiment> {
  const postSentiments = await Promise.all(
    posts.map(p => analyzePostSentiment('system', p.id, p.content))
  );

  // Handle empty posts
  if (postSentiments.length === 0) {
    return {
      posts: [],
      overall_sentiment: 'neutral',
      average_score: 0,
      dominant_emotion: 'neutral',
      sentiment_trend: 'stable',
      polarization_index: 0,
      controversy_score: 0,
    };
  }

  // Calculate overall metrics
  const scores = postSentiments.map(ps => ps.score);
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  // Determine overall sentiment
  let overallSentiment: SentimentType = 'neutral';
  if (averageScore > 0.6) overallSentiment = 'very_positive';
  else if (averageScore > 0.2) overallSentiment = 'positive';
  else if (averageScore < -0.6) overallSentiment = 'very_negative';
  else if (averageScore < -0.2) overallSentiment = 'negative';

  // Find dominant emotion
  const emotionCounts: Record<EmotionType, number> = {
    excitement: 0,
    anger: 0,
    fear: 0,
    disappointment: 0,
    hope: 0,
    curiosity: 0,
    neutral: 0,
  };

  for (const ps of postSentiments) {
    for (const emotion of ps.emotions) {
      emotionCounts[emotion.emotion] = (emotionCounts[emotion.emotion] || 0) + emotion.intensity;
    }
  }

  const dominantEmotion = Object.entries(emotionCounts)
    .sort(([_, a], [__, b]) => b - a)[0][0] as EmotionType;

  // Sentiment trend (comparing first third vs last third)
  const thirdSize = Math.max(Math.ceil(scores.length / 3), 1);
  const firstThirdAvg = scores.slice(0, thirdSize).reduce((a, b) => a + b, 0) / thirdSize;
  const lastThirdAvg = scores.slice(-thirdSize).reduce((a, b) => a + b, 0) / thirdSize;

  const sentimentTrend: 'improving' | 'declining' | 'stable' =
    lastThirdAvg > firstThirdAvg + 0.1 ? 'improving' :
    lastThirdAvg < firstThirdAvg - 0.1 ? 'declining' :
    'stable';

  // Calculate polarization (high variance = polarized)
  const variance = scores.length > 0 ? scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length : 0;
  const polarizationIndex = Math.min(Math.sqrt(variance) * 100, 100);

  // Controversy score (opposite sentiments)
  const veryPos = postSentiments.filter(ps => ps.sentiment === 'very_positive').length;
  const veryNeg = postSentiments.filter(ps => ps.sentiment === 'very_negative').length;
  const controversyScore = postSentiments.length > 0 ? Math.min((Math.min(veryPos, veryNeg) / postSentiments.length) * 200, 100) : 0;

  return {
    posts: postSentiments,
    overall_sentiment: overallSentiment,
    average_score: averageScore,
    dominant_emotion: dominantEmotion,
    sentiment_trend: sentimentTrend,
    polarization_index: polarizationIndex,
    controversy_score: controversyScore,
  };
}

/**
 * Detect sentiment spikes (sudden sentiment shifts)
 */
export function detectSentimentSpike(
  previousSentiment: number,
  currentSentiment: number,
  threshold: number = 0.5
): boolean {
  return Math.abs(currentSentiment - previousSentiment) > threshold;
}
