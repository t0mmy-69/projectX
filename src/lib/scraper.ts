// Data Collection/Scraper Service
// Supports both real X API and mock data fallback

import { memoryDB, ScrapedPost, ViralScore, PostCategory } from './db';
import { calculateViralScore, shouldIgnorePost, roundViralScore } from './viralScore';
import { classifyPost } from './categoryEngine';
import { createXAPIClient, isXAPIAvailable } from './xApiClient';

// Mock data for testing - fallback when X API is unavailable
const MOCK_POSTS = [
  {
    author: '@developer',
    content: 'Just shipped a new feature. Viral scores are calculated in O(1) time now. The algorithm is so simple I can\'t believe we missed it.',
    likes: 120,
    reposts: 45,
    replies: 23
  },
  {
    author: '@creator',
    content: 'breaking: the future of AI is not LLMs but something even more powerful. Here\'s why...',
    likes: 890,
    reposts: 234,
    replies: 156
  },
  {
    author: '@analyst',
    content: 'Data analysis: posts with questions get 3x more engagement than statements. Full report coming tomorrow.',
    likes: 234,
    reposts: 89,
    replies: 67
  },
  {
    author: '@meme_account',
    content: 'when you finally understand async/await 😂😂😂',
    likes: 1200,
    reposts: 890,
    replies: 234
  },
  {
    author: '@news_outlet',
    content: 'JUST IN: Major tech company announces new initiative. More details at 9 PM.',
    likes: 5600,
    reposts: 2300,
    replies: 1200
  },
  {
    author: '@thought_leader',
    content: 'Hot take: The best engineers spend 80% of time on trivial tasks. You probably agree.',
    likes: 456,
    reposts: 123,
    replies: 89
  }
];

export interface ScraperConfig {
  topicId: string;
  keyword: string;
  limit?: number;
}

function getMockPosts(limit: number): any[] {
  return MOCK_POSTS.slice(0, Math.min(limit, MOCK_POSTS.length)).map(
    post => ({
      ...post,
      posted_at: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000)
    })
  );
}

export async function scrapePostsForTopic(config: ScraperConfig): Promise<ScrapedPost[]> {
  const { topicId, keyword, limit = 10 } = config;
  const scrapedPosts: ScrapedPost[] = [];

  // Try X API first if available
  const useXAPI = process.env.USE_X_API === 'true' && await isXAPIAvailable();

  let selectedPosts: any[] = [];

  if (useXAPI) {
    try {
      console.log(`[Scraper] Using X API for keyword: ${keyword}`);
      const xClient = await createXAPIClient();
      const response = await xClient.searchPosts(keyword, limit);

      selectedPosts = (response.data || []).map(tweet => {
        const user = response.includes?.users?.find(u => u.id === tweet.author_id);
        return {
          author: user ? `@${user.username}` : '@unknown',
          content: tweet.text,
          likes: tweet.public_metrics.like_count,
          reposts: tweet.public_metrics.retweet_count,
          replies: tweet.public_metrics.reply_count,
          posted_at: new Date(tweet.created_at)
        };
      });
    } catch (error) {
      console.warn('[Scraper] X API error, falling back to mock data:', error);
      selectedPosts = getMockPosts(limit);
    }
  } else {
    // Use mock data
    console.log('[Scraper] Using mock data fallback');
    selectedPosts = getMockPosts(limit);
  }

  const now = new Date();

  // Add randomness to simulate real engagement variations
  const postsWithVariance = selectedPosts.map(post => ({
    ...post,
    likes: Math.max(0, post.likes + Math.floor((Math.random() - 0.5) * 50)),
    reposts: Math.max(0, post.reposts + Math.floor((Math.random() - 0.5) * 25)),
    replies: Math.max(0, post.replies + Math.floor((Math.random() - 0.5) * 15))
  }));

  for (const post of postsWithVariance) {
    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if post should be ignored
    const postedAt = new Date(now.getTime() - Math.random() * 12 * 60 * 60 * 1000); // Posted within last 12 hours
    const metrics = {
      likes: post.likes,
      reposts: post.reposts,
      replies: post.replies,
      posted_at: postedAt
    };

    if (shouldIgnorePost(metrics, postedAt)) {
      continue;
    }

    // Create post record
    const scrapedPost: ScrapedPost = {
      id: postId,
      topic_id: topicId,
      author: post.author,
      content: post.content,
      likes: post.likes,
      reposts: post.reposts,
      replies: post.replies,
      posted_at: postedAt,
      scraped_at: now,
      created_at: now,
      updated_at: now
    };

    scrapedPosts.push(scrapedPost);
    memoryDB.posts.set(postId, scrapedPost);

    // Calculate viral score
    const viralScore = calculateViralScore(metrics);
    const scoreRecord: ViralScore = {
      id: `score_${postId}`,
      post_id: postId,
      score: roundViralScore(viralScore),
      engagement_rate: ((post.likes + post.reposts + post.replies) / 1000) * 100,
      calculated_at: now,
      created_at: now,
      updated_at: now
    };
    memoryDB.viralScores.set(`score_${postId}`, scoreRecord);

    // Classify post
    const classification = classifyPost(post.content);
    const categoryRecord: PostCategory = {
      id: `cat_${postId}`,
      post_id: postId,
      category: classification.category,
      confidence: classification.confidence,
      created_at: now,
      updated_at: now
    };
    memoryDB.categories.set(`cat_${postId}`, categoryRecord);
  }

  return scrapedPosts;
}

export async function scrapeAllUserTopics(userId: string): Promise<{ [topicId: string]: ScrapedPost[] }> {
  const userTopics = Array.from(memoryDB.topics.values()).filter(t => t.user_id === userId && t.is_active);

  const results: { [topicId: string]: ScrapedPost[] } = {};

  for (const topic of userTopics) {
    const posts = await scrapePostsForTopic({
      topicId: topic.id,
      keyword: topic.keyword,
      limit: 10
    });
    results[topic.id] = posts;
  }

  return results;
}
