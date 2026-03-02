import { NextRequest, NextResponse } from 'next/server';
import { memoryDB } from '@/lib/db';

// GET /api/user/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    const userName = request.headers.get('x-user-name');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    let user = memoryDB.users.get(userId);

    // Auto-create user from JWT claims if not in DB (handles hot-reload, new signups, etc)
    if (!user) {
      const now = new Date();
      const email = userEmail || `${userId}@narrativeos.app`;
      const name = userName || email.split('@')[0];
      user = {
        id: userId,
        email,
        name,
        subscription_tier: 'free',
        created_at: now,
        updated_at: now,
      };
      memoryDB.users.set(userId, user);
    }

    const persona = memoryDB.personas.get(userId);
    const topics = Array.from(memoryDB.topics.values()).filter(t => t.user_id === userId);
    const drafts = Array.from(memoryDB.drafts.values()).filter(d => d.user_id === userId);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_tier: user.subscription_tier,
        x_username: (user as any).x_username,
        persona,
        topics_count: topics.length,
        drafts_count: drafts.length,
        created_at: user.created_at,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile', details: String(error) }, { status: 500 });
  }
}

// PATCH /api/user/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    const userName = request.headers.get('x-user-name');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const body = await request.json();
    const { name, x_username, llm_api_key } = body;

    let user = memoryDB.users.get(userId);
    // Auto-create if not found
    if (!user) {
      const now = new Date();
      const email = userEmail || `${userId}@narrativeos.app`;
      user = {
        id: userId,
        email,
        name: userName || name || email.split('@')[0],
        subscription_tier: 'free',
        created_at: now,
        updated_at: now,
      };
    }

    const updated = {
      ...user,
      ...(name && { name }),
      ...(x_username !== undefined && { x_username }),
      ...(llm_api_key !== undefined && { llm_api_key } as any),
      updated_at: new Date(),
    };
    memoryDB.users.set(userId, updated);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile', details: String(error) }, { status: 500 });
  }
}
