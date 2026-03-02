// Admin Users Management
// View and manage users

import { NextRequest, NextResponse } from 'next/server';
import { memoryDB } from '@/lib/db';
import { isAdmin } from '@/lib/adminCheck';
import { getTokenStats } from '@/lib/tokenTracking';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined;

    if (!isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const pageSize = parseInt(request.nextUrl.searchParams.get('page_size') || '20');
    const searchQuery = request.nextUrl.searchParams.get('search')?.toLowerCase() || '';

    // Get all users
    let users = Array.from(memoryDB.users.values());

    // Filter by search query
    if (searchQuery) {
      users = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery) ||
        u.name.toLowerCase().includes(searchQuery) ||
        u.id.includes(searchQuery)
      );
    }

    // Paginate
    const total = users.length;
    const startIdx = (page - 1) * pageSize;
    const paginatedUsers = users.slice(startIdx, startIdx + pageSize);

    // Enrich with stats
    const usersWithStats = paginatedUsers.map(u => {
      const stats = getTokenStats(u.id);
      const userTopics = Array.from(memoryDB.topics.values()).filter(t => t.user_id === u.id);
      const userPosts = Array.from(memoryDB.posts.values()).filter(p =>
        userTopics.some(t => t.id === p.topic_id)
      );
      const userDrafts = Array.from(memoryDB.drafts.values()).filter(d => d.user_id === u.id);

      return {
        id: u.id,
        email: u.email,
        name: u.name,
        subscription_tier: u.subscription_tier,
        created_at: u.created_at,
        updated_at: u.updated_at,
        stats: {
          topics: userTopics.length,
          posts: userPosts.length,
          drafts: userDrafts.length,
          tokens_used: stats.totalTokens,
          api_cost: stats.totalCost,
          api_calls: stats.successCount + stats.errorCount,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: usersWithStats,
      pagination: {
        page,
        page_size: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error('[Admin] Users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || undefined;

    if (!isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id required' },
        { status: 400 }
      );
    }

    // Don't allow deleting self
    if (user_id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Get user
    const user = memoryDB.users.get(user_id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user data
    memoryDB.users.delete(user_id);

    // Delete related data
    Array.from(memoryDB.topics.values())
      .filter(t => t.user_id === user_id)
      .forEach(t => memoryDB.topics.delete(t.id));

    Array.from(memoryDB.drafts.values())
      .filter(d => d.user_id === user_id)
      .forEach(d => memoryDB.drafts.delete(d.id));

    return NextResponse.json({
      success: true,
      message: `User ${user.email} deleted`,
    });
  } catch (error: any) {
    console.error('[Admin] User delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message },
      { status: 500 }
    );
  }
}
