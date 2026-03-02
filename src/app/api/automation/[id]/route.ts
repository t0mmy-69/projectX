import { NextRequest, NextResponse } from 'next/server';
import { memoryDB } from '@/lib/db';
import { getUserId } from '@/lib/getUser';

// PATCH /api/automation/[id] - Update a rule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const rule = memoryDB.automationRules.get(id);
    if (!rule || rule.user_id !== userId) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    const body = await request.json();
    const updated = {
      ...rule,
      ...body,
      id: rule.id,
      user_id: rule.user_id,
      updated_at: new Date(),
    };
    memoryDB.automationRules.set(id, updated);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update rule', details: String(error) }, { status: 500 });
  }
}

// DELETE /api/automation/[id] - Delete a rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const rule = memoryDB.automationRules.get(id);
    if (!rule || rule.user_id !== userId) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    memoryDB.automationRules.delete(id);

    return NextResponse.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete rule', details: String(error) }, { status: 500 });
  }
}
