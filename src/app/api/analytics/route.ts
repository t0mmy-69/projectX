// Analytics API
// Provides metrics and insights on performance, engagement, and trends

import { NextRequest, NextResponse } from 'next/server';
import { memoryDB } from '@/lib/db';
import { analyzeConversationSentiment, analyzePostSentiment } from '@/lib/sentimentAnalyzer';
import { getTokenStats } from '@/lib/tokenTracking';

// GET /api/analytics - Get analytics dashboard data
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const timeframe = request.nextUrl.searchParams.get('timeframe') || '30d';
    const topicId = request.nextUrl.searchParams.get('topic_id');

    // Parse timeframe to hours
    const hoursMap: Record<string, number> = {
      '24h': 24,
      '7d': 168,
      '30d': 720,
      '90d': 2160,
    };
    const hours = hoursMap[timeframe] || 720;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get user's topics
    const userTopics = Array.from(memoryDB.topics.values()).filter(t => t.user_id === userId);

    // Get posts
    const userPosts = Array.from(memoryDB.posts.values()).filter(p =>
      userTopics.some(t => t.id === p.topic_id) &&
      new Date(p.posted_at) > cutoff &&
      (!topicId || p.topic_id === topicId)
    );

    // Get drafts
    const userDrafts = Array.from(memoryDB.drafts.values()).filter(
      d => d.user_id === userId && new Date(d.created_at) > cutoff
    );

    // Calculate metrics
    const totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);
    const totalReposts = userPosts.reduce((sum, p) => sum + p.reposts, 0);
    const totalReplies = userPosts.reduce((sum, p) => sum + p.replies, 0);
    const totalEngagement = totalLikes + totalReposts + totalReplies;
    const averageEngagementPerPost = userPosts.length > 0 ? totalEngagement / userPosts.length : 0;

    // Get viral posts (top 5)
    const viralPosts = [...userPosts]
      .sort((a, b) => {
        const scoreA = a.likes + a.reposts * 2 + a.replies;
        const scoreB = b.likes + b.reposts * 2 + b.replies;
        return scoreB - scoreA;
      })
      .slice(0, 5);

    // Analyze sentiment
    const conversationSentiment = await analyzeConversationSentiment(
      userPosts.map(p => ({ id: p.id, content: p.content }))
    );

    // Get token usage
    const tokenStats = getTokenStats(userId);

    // Calculate daily averages
    const daysInPeriod = Math.ceil(hours / 24);
    const dailyAverageEngagement = totalEngagement / daysInPeriod;
    const dailyAveragePosts = userPosts.length / daysInPeriod;

    return NextResponse.json({
      success: true,
      data: {
        period: timeframe,
        metrics: {
          total_posts: userPosts.length,
          total_engagement: totalEngagement,
          total_likes: totalLikes,
          total_reposts: totalReposts,
          total_replies: totalReplies,
          average_engagement_per_post: averageEngagementPerPost,
          engagement_rate: userPosts.length > 0 ? (totalEngagement / (userPosts.length * 100)) * 100 : 0,
          daily_average_engagement: dailyAverageEngagement,
          daily_average_posts: dailyAveragePosts,
        },
        engagement_breakdown: {
          likes_percent: totalEngagement > 0 ? (totalLikes / totalEngagement) * 100 : 0,
          reposts_percent: totalEngagement > 0 ? (totalReposts / totalEngagement) * 100 : 0,
          replies_percent: totalEngagement > 0 ? (totalReplies / totalEngagement) * 100 : 0,
        },
        sentiment: {
          overall: conversationSentiment.overall_sentiment,
          average_score: conversationSentiment.average_score,
          dominant_emotion: conversationSentiment.dominant_emotion,
          trend: conversationSentiment.sentiment_trend,
          polarization: conversationSentiment.polarization_index,
          controversy: conversationSentiment.controversy_score,
        },
        top_posts: viralPosts.map(p => ({
          id: p.id,
          author: p.author,
          engagement: p.likes + p.reposts + p.replies,
        })),
        drafts: {
          total: userDrafts.length,
          recent: userDrafts.slice(0, 3),
        },
        ai_usage: {
          total_tokens: tokenStats.totalTokens,
          total_cost: tokenStats.totalCost,
          success_count: tokenStats.successCount,
          error_count: tokenStats.errorCount,
          by_function: tokenStats.byFunction,
        },
      },
    });
  } catch (error: any) {
    console.error('[Analytics] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    );
  }
}
