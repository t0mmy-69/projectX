import { NextRequest, NextResponse } from 'next/server';
import { scrapePostsForTopic, scrapeAllUserTopics } from '@/lib/scraper';
import { getUserId } from '@/lib/getUser';

// POST /api/scrape - Trigger scraping for a specific topic or all user topics
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const apiKey = request.headers.get('x-api-key');

    // Optional: require API key for cron job triggers
    const isAuthorized = userId || apiKey === process.env.SCRAPER_API_KEY;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { topic_id, keyword } = body;

    if (topic_id && keyword) {
      // Scrape specific topic
      const posts = await scrapePostsForTopic({
        topicId: topic_id,
        keyword,
        limit: 10
      });

      return NextResponse.json({
        success: true,
        message: `Scraped ${posts.length} posts for topic`,
        data: {
          topic_id,
          posts_count: posts.length,
          posts
        }
      });
    } else if (userId) {
      // Scrape all user topics
      const results = await scrapeAllUserTopics(userId);

      const totalPosts = Object.values(results).reduce((sum, posts) => sum + posts.length, 0);

      return NextResponse.json({
        success: true,
        message: `Scraped ${totalPosts} posts across all topics`,
        data: {
          topics_scraped: Object.keys(results).length,
          total_posts: totalPosts,
          by_topic: results
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Either topic_id + keyword or user_id required' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to scrape posts', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/scrape/health - Check scraper health (for monitoring)
export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'healthy',
    message: 'Scraper service is running',
    timestamp: new Date().toISOString()
  });
}
