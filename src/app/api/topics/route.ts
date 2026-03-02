import { NextRequest, NextResponse } from 'next/server';
import { memoryDB, Topic } from '@/lib/db';

// GET /api/topics - List all topics for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    // Filter topics by user_id
    const userTopics = Array.from(memoryDB.topics.values()).filter(
      t => t.user_id === userId
    );

    return NextResponse.json({
      success: true,
      data: userTopics
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch topics', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/topics - Create a new topic
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { keyword, category_filter } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    const topicId = `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newTopic: Topic = {
      id: topicId,
      user_id: userId,
      keyword,
      category_filter,
      is_active: true,
      created_at: now,
      updated_at: now
    };

    memoryDB.topics.set(topicId, newTopic);

    return NextResponse.json(
      {
        success: true,
        message: 'Topic created successfully',
        data: newTopic
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create topic', details: String(error) },
      { status: 500 }
    );
  }
}
