import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/getUser';
import { memoryDB, Agent, LLMProvider, AgentTone } from '@/lib/db';

// GET /api/agents — list user's agents
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const agents = Array.from(memoryDB.agents.values())
    .filter(a => a.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ success: true, data: agents });
}

// POST /api/agents — create a new agent
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, description, prompt, tone, topics, reply_style, llm_provider, llm_model, auto_mode, max_replies_hour, min_viral_score } = body;

  if (!name?.trim())   return NextResponse.json({ error: 'Agent name is required' }, { status: 400 });
  if (!prompt?.trim()) return NextResponse.json({ error: 'System prompt is required' }, { status: 400 });

  const validTones: AgentTone[] = ['professional', 'casual', 'witty', 'provocative', 'educational'];
  const validProviders: LLMProvider[] = ['claude', 'openai', 'grok', 'gemini', 'deepseek'];

  const now = new Date();
  const id  = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const agent: Agent = {
    id,
    user_id: userId,
    name: name.trim(),
    description: description?.trim() || '',
    prompt: prompt.trim(),
    tone: (validTones.includes(tone) ? tone : 'professional') as AgentTone,
    topics: Array.isArray(topics) ? topics.map((t: string) => t.trim()).filter(Boolean) : [],
    reply_style: reply_style?.trim() || 'Concise and insightful',
    llm_provider: (validProviders.includes(llm_provider) ? llm_provider : 'claude') as LLMProvider,
    llm_model: llm_model?.trim() || 'claude-3-5-haiku-20241022',
    auto_mode: Boolean(auto_mode),
    max_replies_hour: typeof max_replies_hour === 'number' ? Math.max(1, Math.min(60, max_replies_hour)) : 10,
    min_viral_score: typeof min_viral_score === 'number' ? Math.max(0, min_viral_score) : 0,
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  memoryDB.agents.set(id, agent);

  return NextResponse.json({ success: true, data: agent }, { status: 201 });
}
