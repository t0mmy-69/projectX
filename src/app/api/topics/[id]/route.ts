import { NextRequest, NextResponse } from 'next/server';
import { memoryDB } from '@/lib/db';

// PATCH /api/topics/[id] - Update a topic
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const topic = memoryDB.topics.get(id);
    if (!topic || topic.user_id !== userId) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const body = await request.json();
    const updated = {
      ...topic,
      ...body,
      id: topic.id,
      user_id: topic.user_id,
      updated_at: new Date(),
    };
    memoryDB.topics.set(id, updated);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update topic', details: String(error) }, { status: 500 });
  }
}

// DELETE /api/topics/[id] - Delete a topic
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const topic = memoryDB.topics.get(id);
    if (!topic || topic.user_id !== userId) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    memoryDB.topics.delete(id);

    return NextResponse.json({ success: true, message: 'Topic deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete topic', details: String(error) }, { status: 500 });
  }
}
