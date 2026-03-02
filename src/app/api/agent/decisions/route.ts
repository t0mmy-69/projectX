// GET /api/agent/decisions — list agent activity history
import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/getUser';
import { memoryDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const agentId = request.nextUrl.searchParams.get('agent_id');
  const limit   = parseInt(request.nextUrl.searchParams.get('limit') || '50');

  let decisions = Array.from(memoryDB.agentDecisions.values())
    .filter(d => d.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (agentId) decisions = decisions.filter(d => d.agent_id === agentId);
  decisions = decisions.slice(0, limit);

  return NextResponse.json({ success: true, data: decisions });
}
