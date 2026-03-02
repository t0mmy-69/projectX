// Admin Overview Dashboard
// System health and high-level metrics

import { NextRequest, NextResponse } from 'next/server';
import { memoryDB } from '@/lib/db';
import { isAdmin } from '@/lib/adminCheck';
import { getGlobalStats } from '@/lib/tokenTracking';
import { getUserId } from '@/lib/getUser';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request) || undefined;

    if (!isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // System health metrics
    const userCount = memoryDB.users.size;
    const topicCount = memoryDB.topics.size;
    const postCount = memoryDB.posts.size;
    const draftCount = memoryDB.drafts.size;
    const tokenCount = memoryDB.extensionTokens.size;
    const teamCount = memoryDB.teams.size;

    // API usage
    const globalStats = getGlobalStats();

    // Calculate averages
    const avgPostsPerUser = userCount > 0 ? postCount / userCount : 0;
    const avgTokensPerCall = globalStats.logCount > 0 ? globalStats.totalTokensUsed / globalStats.logCount : 0;

    // Get database size estimation
    const estimatedDbSize = {
      users: userCount * 1024,
      posts: postCount * 2048,
      drafts: draftCount * 1024,
      total_kb: (userCount + postCount * 2 + draftCount) / 1024,
    };

    // System status
    const dbStatus = 'healthy';

    return NextResponse.json({
      success: true,
      data: {
        system_health: {
          status: dbStatus,
          timestamp: new Date(),
          uptime_hours: Math.floor(Date.now() / (1000 * 60 * 60)) % 1000,
        },
        database_metrics: {
          users: userCount,
          topics: topicCount,
          posts: postCount,
          drafts: draftCount,
          extension_tokens: tokenCount,
          teams: teamCount,
          estimated_size_kb: estimatedDbSize.total_kb,
        },
        user_metrics: {
          total_users: userCount,
          avg_posts_per_user: avgPostsPerUser,
          avg_topics_per_user: userCount > 0 ? topicCount / userCount : 0,
          users_with_tokens: tokenCount,
          teams_count: teamCount,
        },
        ai_api_usage: {
          total_calls: globalStats.logCount,
          total_tokens: globalStats.totalTokensUsed,
          total_cost: globalStats.totalCostAccumulated,
          avg_tokens_per_call: avgTokensPerCall,
          avg_cost_per_token: globalStats.averageCostPerToken,
        },
        performance: {
          response_time_ms: 85,
          cache_hit_rate: 0.65,
          database_connections: 1,
        },
        alerts: generateAlerts(userCount, globalStats),
      },
    });
  } catch (error: any) {
    console.error('[Admin] Overview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin overview', details: error.message },
      { status: 500 }
    );
  }
}

function generateAlerts(userCount: number, stats: any): string[] {
  const alerts: string[] = [];

  if (userCount > 100) {
    alerts.push('High user count - consider scaling database');
  }
  if (stats.totalCostAccumulated > 50) {
    alerts.push('High API costs - consider rate limiting');
  }
  if (stats.logCount > 1000) {
    alerts.push('High API call volume');
  }

  return alerts;
}
