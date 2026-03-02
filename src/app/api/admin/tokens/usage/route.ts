// Admin Token Usage Tracking
// Monitor Claude API token usage and costs

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminCheck';
import { getAllTokenLogs, getGlobalStats } from '@/lib/tokenTracking';
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

    const timeframe = request.nextUrl.searchParams.get('timeframe') || '30d';
    const groupBy = request.nextUrl.searchParams.get('group_by') || 'day';

    // Get all logs
    const logs = getAllTokenLogs();

    // Filter by timeframe
    const hoursMap: Record<string, number> = {
      '24h': 24,
      '7d': 168,
      '30d': 720,
      '90d': 2160,
    };
    const hours = hoursMap[timeframe] || 720;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const filteredLogs = logs.filter(log => new Date(log.created_at) > cutoff);

    // Get global stats
    const globalStats = getGlobalStats();

    // Group and aggregate
    const grouped: Record<string, any> = {};

    for (const log of filteredLogs) {
      const key = getGroupKey(log.created_at, groupBy);

      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          total_tokens: 0,
          total_cost: 0,
          call_count: 0,
          by_model: {},
          by_type: {},
        };
      }

      grouped[key].total_tokens += log.total_tokens;
      grouped[key].total_cost += log.cost;
      grouped[key].call_count += 1;

      const model = log.model || 'unknown';
      if (!grouped[key].by_model[model]) {
        grouped[key].by_model[model] = { tokens: 0, cost: 0, calls: 0 };
      }
      grouped[key].by_model[model].tokens += log.total_tokens;
      grouped[key].by_model[model].cost += log.cost;
      grouped[key].by_model[model].calls += 1;

      const type = log.function_name || 'unknown';
      if (!grouped[key].by_type[type]) {
        grouped[key].by_type[type] = { tokens: 0, cost: 0, calls: 0 };
      }
      grouped[key].by_type[type].tokens += log.total_tokens;
      grouped[key].by_type[type].cost += log.cost;
      grouped[key].by_type[type].calls += 1;
    }

    const data = Object.values(grouped).sort((a, b) =>
      new Date(b.period).getTime() - new Date(a.period).getTime()
    );

    // Calculate top users
    const userStats: Record<string, any> = {};
    for (const log of filteredLogs) {
      if (!userStats[log.user_id]) {
        userStats[log.user_id] = { tokens: 0, cost: 0, calls: 0 };
      }
      userStats[log.user_id].tokens += log.total_tokens;
      userStats[log.user_id].cost += log.cost;
      userStats[log.user_id].calls += 1;
    }

    const topUsers = Object.entries(userStats)
      .map(([uid, stats]) => ({ user_id: uid, ...stats }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        timeframe,
        global_stats: {
          total_tokens: globalStats.totalTokensUsed,
          total_cost: globalStats.totalCostAccumulated,
          total_calls: globalStats.logCount,
          avg_cost_per_token: globalStats.averageCostPerToken,
          average_tokens_per_call: globalStats.logCount > 0 ? globalStats.totalTokensUsed / globalStats.logCount : 0,
          average_cost_per_call: globalStats.logCount > 0 ? globalStats.totalCostAccumulated / globalStats.logCount : 0,
        },
        usage_by_period: data,
        top_users: topUsers,
        logs_count: filteredLogs.length,
      },
    });
  } catch (error: any) {
    console.error('[Admin] Token usage error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token usage', details: error.message },
      { status: 500 }
    );
  }
}

function getGroupKey(date: Date, groupBy: string): string {
  const d = new Date(date);
  if (groupBy === 'hour') {
    return d.toISOString().slice(0, 13) + ':00:00Z';
  } else if (groupBy === 'day') {
    return d.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}
