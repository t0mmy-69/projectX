// X API v2 Client for real post scraping

import { RateLimiterMemory } from 'rate-limiter-flexible';

export interface XTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count?: number;
    bookmark_count?: number;
  };
}

export interface XUser {
  id: string;
  username: string;
  name: string;
}

export interface SearchResponse {
  data: XTweet[];
  includes?: {
    users: XUser[];
  };
  meta: {
    result_count: number;
  };
}

const rateLimiter = new RateLimiterMemory({
  points: 300, // 300 requests per 15 minutes
  duration: 900, // 15 minutes in seconds
});

export class XAPIClient {
  private baseUrl = 'https://api.twitter.com/2';
  private accessToken: string;

  constructor(bearerToken: string) {
    if (!bearerToken) {
      throw new Error('X API Bearer token not provided');
    }
    this.accessToken = bearerToken;
  }

  async searchPosts(
    query: string,
    limit: number = 10
  ): Promise<SearchResponse> {
    // Rate limiting check
    try {
      await rateLimiter.consume('search-posts');
    } catch (error) {
      const waitTime = error && typeof error === 'object' && 'msBeforeNext' in error ? (error as any).msBeforeNext : 5000;
      throw new Error(`Rate limited. Wait ${Math.ceil(waitTime / 1000)}s before retrying`);
    }

    const params = new URLSearchParams({
      query,
      max_results: Math.min(limit, 100).toString(),
      'tweet.fields': 'public_metrics,created_at,author_id',
      'user.fields': 'username,name',
      expansions: 'author_id'
    });

    const url = `${this.baseUrl}/tweets/search/recent?${params}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'User-Agent': 'NarrativeOS/1.0'
        }
      });

      if (response.status === 429) {
        // Rate limit error
        const resetTime = response.headers.get('x-rate-limit-reset');
        const waitMs = resetTime ? (parseInt(resetTime) * 1000 - Date.now()) : 60000;
        throw new Error(`X API rate limited. Wait ${Math.ceil(waitMs / 1000)}s`);
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`X API error ${response.status}: ${error}`);
      }

      const data: SearchResponse = await response.json();
      return data;
    } catch (error) {
      console.error('[X API] Search error:', error);
      throw error;
    }
  }

  async getUserTimeline(
    userId: string,
    limit: number = 10
  ): Promise<SearchResponse> {
    // Rate limiting
    try {
      await rateLimiter.consume('user-timeline');
    } catch (error) {
      throw new Error(`Rate limited on timeline`);
    }

    const params = new URLSearchParams({
      max_results: Math.min(limit, 100).toString(),
      'tweet.fields': 'public_metrics,created_at',
      'user.fields': 'username,name'
    });

    const url = `${this.baseUrl}/users/${userId}/tweets?${params}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'User-Agent': 'NarrativeOS/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`X API timeline error ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      return data;
    } catch (error) {
      console.error('[X API] Timeline error:', error);
      throw error;
    }
  }

  async getUser(username: string): Promise<XUser | null> {
    try {
      await rateLimiter.consume('get-user');
    } catch (error) {
      return null;
    }

    const url = `${this.baseUrl}/users/by/username/${username}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'User-Agent': 'NarrativeOS/1.0'
        }
      });

      if (!response.ok) {
        return null;
      }

      const data: { data: XUser } = await response.json();
      return data.data;
    } catch (error) {
      console.error('[X API] Get user error:', error);
      return null;
    }
  }

  getRateLimiterStatus() {
    return {
      message: 'Rate limiter active: 300 requests per 15 minutes'
    };
  }
}

export async function createXAPIClient(): Promise<XAPIClient> {
  // Import here to avoid circular dependency
  const { getAPIKey } = require('./apiKeyManager');

  let token = getAPIKey('X_API_TOKEN');
  if (!token) {
    token = process.env.X_API_TOKEN;
  }
  if (!token) {
    throw new Error('X_API_TOKEN not found. Please configure it in admin panel.');
  }
  return new XAPIClient(token);
}

export async function isXAPIAvailable(): Promise<boolean> {
  try {
    const client = await createXAPIClient();
    // Try a simple request
    await client.getUser('twitter');
    return true;
  } catch (error) {
    console.warn('[X API] Not available:', error);
    return false;
  }
}
