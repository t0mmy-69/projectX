// Narratives API
// Detects and analyzes narrative shifts and patterns

import { NextRequest, NextResponse } from 'next/server';
import { memoryDB, ScrapedPost } from '@/lib/db';
import { detectNarratives, detectNarrativeShifts } from '@/lib/narrativeDetector';
import { analyzeConversationSentiment } from '@/lib/sentimentAnalyzer';
import { getUserId } from '@/lib/getUser';

// GET /api/narratives - List detected narratives
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const topicId = request.nextUrl.searchParams.get('topic_id');
    const timeframe = request.nextUrl.searchParams.get('timeframe') || '24h';

    // Get posts for analysis
    const userPosts = Array.from(memoryDB.posts.values()).filter(p =>
      !topicId || p.topic_id === topicId
    );

    // Filter by timeframe
    const now = new Date();
    const hoursAgo = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 24;
    const cutoff = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    const recentPosts = userPosts.filter(p => new Date(p.posted_at) > cutoff);

    // Detect narratives
    const narratives = await detectNarratives(userId, recentPosts);

    // Analyze sentiment of the conversation
    const sentiment = await analyzeConversationSentiment(
      recentPosts.map(p => ({ id: p.id, content: p.content }))
    );

    return NextResponse.json({
      success: true,
      data: {
        narratives,
        conversation_sentiment: sentiment,
        post_count: recentPosts.length,
        timeframe,
      },
    });
  } catch (error: any) {
    console.error('[Narratives] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch narratives', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/narratives - Detect narrative shifts
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { topic_id, post_id } = body;

    // Get trigger post
    const triggerPost = memoryDB.posts.get(post_id);
    if (!triggerPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Get all posts for topic
    const topicPosts = Array.from(memoryDB.posts.values()).filter(p =>
      !topic_id || p.topic_id === topic_id
    );

    // Get recent posts before trigger
    const beforeTrigger = topicPosts.filter(p => new Date(p.posted_at) < new Date(triggerPost.posted_at));
    const afterTrigger = topicPosts.filter(p => new Date(p.posted_at) >= new Date(triggerPost.posted_at));

    // Detect narratives in both periods
    const beforeNarratives = await detectNarratives(userId, beforeTrigger.slice(-10));
    const afterNarratives = await detectNarratives(userId, afterTrigger.slice(0, 10));

    // Detect shifts
    const shifts = await detectNarrativeShifts(
      userId,
      beforeNarratives,
      afterNarratives,
      { id: triggerPost.id, content: triggerPost.content }
    );

    return NextResponse.json({
      success: true,
      message: 'Narrative shifts detected',
      data: {
        trigger_post_id: post_id,
        before_narratives: beforeNarratives,
        after_narratives: afterNarratives,
        shifts,
        shift_count: shifts.length,
      },
    });
  } catch (error: any) {
    console.error('[Narratives] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to detect narrative shifts', details: error.message },
      { status: 500 }
    );
  }
}
