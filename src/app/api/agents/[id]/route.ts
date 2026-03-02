import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/getUser';
import { memoryDB, LLMProvider, AgentTone } from '@/lib/db';

// GET /api/agents/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const agent = memoryDB.agents.get(id);
  if (!agent || agent.user_id !== userId)
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  return NextResponse.json({ success: true, data: agent });
}

// PATCH /api/agents/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const agent = memoryDB.agents.get(id);
  if (!agent || agent.user_id !== userId)
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validTones: AgentTone[] = ['professional', 'casual', 'witty', 'provocative', 'educational'];
  const validProviders: LLMProvider[] = ['claude', 'openai', 'grok', 'gemini', 'deepseek'];

  const updated = {
    ...agent,
    ...(body.name          !== undefined && { name: body.name.trim() }),
    ...(body.description   !== undefined && { description: body.description.trim() }),
    ...(body.prompt        !== undefined && { prompt: body.prompt.trim() }),
    ...(body.tone          !== undefined && { tone: validTones.includes(body.tone) ? body.tone : agent.tone }),
    ...(body.topics        !== undefined && { topics: Array.isArray(body.topics) ? body.topics.map((t: string) => t.trim()).filter(Boolean) : agent.topics }),
    ...(body.reply_style   !== undefined && { reply_style: body.reply_style.trim() }),
    ...(body.llm_provider  !== undefined && { llm_provider: validProviders.includes(body.llm_provider) ? body.llm_provider : agent.llm_provider }),
    ...(body.llm_model     !== undefined && { llm_model: body.llm_model.trim() }),
    ...(body.auto_mode     !== undefined && { auto_mode: Boolean(body.auto_mode) }),
    ...(body.max_replies_hour !== undefined && { max_replies_hour: Math.max(1, Math.min(60, body.max_replies_hour)) }),
    ...(body.min_viral_score  !== undefined && { min_viral_score: Math.max(0, body.min_viral_score) }),
    ...(body.is_active     !== undefined && { is_active: Boolean(body.is_active) }),
    updated_at: new Date(),
  };

  memoryDB.agents.set(id, updated);
  return NextResponse.json({ success: true, data: updated });
}

// DELETE /api/agents/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const agent = memoryDB.agents.get(id);
  if (!agent || agent.user_id !== userId)
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  memoryDB.agents.delete(id);
  return NextResponse.json({ success: true });
}
