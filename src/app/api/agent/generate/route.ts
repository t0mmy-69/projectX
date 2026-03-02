// POST /api/agent/generate
// Called by Chrome Extension content.js to generate a reply using a specific agent + LLM
import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/getUser';
import { memoryDB, AgentDecision } from '@/lib/db';
import { callLLM, generateTemplatReply, LLMProvider } from '@/lib/llmRouter';

export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { agent_id, post_text, post_author, post_url } = body;

  if (!agent_id)   return NextResponse.json({ error: 'agent_id is required' }, { status: 400 });
  if (!post_text)  return NextResponse.json({ error: 'post_text is required' }, { status: 400 });

  // Fetch and verify agent ownership
  const agent = memoryDB.agents.get(agent_id);
  if (!agent || agent.user_id !== userId)
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  if (!agent.is_active)
    return NextResponse.json({ error: 'Agent is paused' }, { status: 400 });

  // Check hourly rate limit (count decisions in last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentDecisions = Array.from(memoryDB.agentDecisions.values())
    .filter(d => d.agent_id === agent_id && new Date(d.created_at) > oneHourAgo);

  if (recentDecisions.length >= agent.max_replies_hour)
    return NextResponse.json({ error: 'Hourly reply limit reached for this agent' }, { status: 429 });

  // Build system + user prompt for LLM
  const systemPrompt = `${agent.prompt}

Tone: ${agent.tone}
Reply style: ${agent.reply_style}

You are generating a reply for Twitter/X. Rules:
- Keep it under 260 characters
- Sound natural and authentic — not like AI
- Match the tone exactly
- Never start with "I"
- No hashtags unless part of the style
- Reply ONLY with the tweet text. No quotes, no explanations.`;

  const userMessage = `Tweet by @${post_author || 'someone'}:
"${post_text}"

Write a reply:`;

  let reply_text = '';
  let tokens_used = 0;
  let llm_model = agent.llm_model;
  let usedLLM = false;

  // Try to get user's API key for this provider
  const keyId = `${userId}_${agent.llm_provider}`;
  const storedKey = memoryDB.userLLMKeys.get(keyId);
  const apiKey = storedKey?.api_key || '';

  if (apiKey) {
    try {
      const result = await callLLM({
        provider: agent.llm_provider as LLMProvider,
        model: agent.llm_model,
        apiKey,
        systemPrompt,
        userMessage,
        maxTokens: 150,
        temperature: 0.85,
      });
      reply_text = result.text;
      tokens_used = result.tokens_used;
      llm_model = result.model;
      usedLLM = true;
    } catch (err: any) {
      console.error('[agent/generate] LLM call failed:', err.message);
      // Fall back to template
    }
  }

  // Fallback: template-based reply
  if (!reply_text) {
    reply_text = generateTemplatReply(agent.tone, post_text, agent.topics);
    llm_model = 'template';
  }

  // Log the decision
  const decisionId = `decision_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const decision: AgentDecision = {
    id: decisionId,
    agent_id,
    user_id: userId,
    post_text,
    post_author: post_author || '',
    post_url: post_url || '',
    reply_text,
    tokens_used,
    llm_provider: usedLLM ? agent.llm_provider : 'template',
    llm_model,
    was_auto_posted: false, // will be updated if extension auto-posts
    created_at: new Date(),
  };
  memoryDB.agentDecisions.set(decisionId, decision);

  return NextResponse.json({
    success: true,
    data: {
      reply: reply_text,
      decision_id: decisionId,
      tokens_used,
      model: llm_model,
      used_ai: usedLLM,
      agent_name: agent.name,
    },
  });
}
