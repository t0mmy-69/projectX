// Multi-LLM Router — routes AI requests to Claude, OpenAI, Grok, Gemini, or DeepSeek
// All providers are called via raw fetch (no extra npm packages needed)

export type LLMProvider = 'claude' | 'openai' | 'grok' | 'gemini' | 'deepseek';

export interface LLMRequest {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  text: string;
  tokens_used: number;
  model: string;
  provider: LLMProvider;
}

// Supported models per provider
export const PROVIDER_MODELS: Record<LLMProvider, { label: string; models: string[] }> = {
  claude: {
    label: 'Claude (Anthropic)',
    models: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
  },
  openai: {
    label: 'GPT (OpenAI)',
    models: ['gpt-4o-mini', 'gpt-4o', 'o1-mini'],
  },
  grok: {
    label: 'Grok (xAI)',
    models: ['grok-3-mini', 'grok-3', 'grok-2-1212'],
  },
  gemini: {
    label: 'Gemini (Google)',
    models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  },
  deepseek: {
    label: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
};

export const DEFAULT_MODELS: Record<LLMProvider, string> = {
  claude: 'claude-3-5-haiku-20241022',
  openai: 'gpt-4o-mini',
  grok: 'grok-3-mini',
  gemini: 'gemini-2.0-flash',
  deepseek: 'deepseek-chat',
};

// ─── Main router ──────────────────────────────────────────────────────────────

export async function callLLM(req: LLMRequest): Promise<LLMResponse> {
  switch (req.provider) {
    case 'claude':   return callClaude(req);
    case 'openai':   return callOpenAI(req);
    case 'grok':     return callGrok(req);
    case 'gemini':   return callGemini(req);
    case 'deepseek': return callDeepSeek(req);
    default:         throw new Error(`Unsupported LLM provider: ${req.provider}`);
  }
}

// ─── Template fallback (no API key required) ─────────────────────────────────

export function generateTemplatReply(tone: string, postText: string, topics: string[]): string {
  const lc = postText.toLowerCase();
  const isQuestion = lc.includes('?') || lc.includes('how') || lc.includes('what') || lc.includes('why');
  const isOpinion  = lc.includes('think') || lc.includes('believe') || lc.includes('feel') || lc.includes('imho');
  const isData     = lc.includes('data') || lc.includes('%') || lc.includes('study') || lc.includes('report');

  const templates: Record<string, string[]> = {
    professional: [
      'This captures a critical inflection point. The downstream implications are significant.',
      'Exactly right. The data backs this up — and most people still aren\'t paying attention.',
      'Worth bookmarking. The pattern here repeats across every major industry disruption.',
      isQuestion ? 'The short answer: it depends on incentive structures, not technology.' : 'The signal here is stronger than the noise suggests.',
      isData ? 'These numbers tell only half the story. Context matters enormously.' : 'First-principles thinking applied correctly leads to this conclusion every time.',
    ],
    casual: [
      'This is genuinely underrated 👀',
      'Been saying this for months. Finally someone with a platform agrees.',
      isQuestion ? 'Real answer: nobody actually knows, and that\'s the interesting part.' : 'Took me a while to see it but this is 100% correct.',
      'The replies on this are going to be wild lol',
      'Main character moment right here.',
    ],
    witty: [
      'Broke: ignoring this. Woke: bookmarking it. Bespoke: already 3 steps ahead.',
      isQuestion ? 'The answer is yes, no, and it\'s complicated — classic.' : 'Plot twist: the consensus has been wrong this whole time.',
      'This tweet aged better than my takes from 2021.',
      'Some people are going to see this and still not get it.',
      'The contrarian take writes itself here.',
    ],
    provocative: [
      'Controversial take: this is the most important point nobody wants to discuss.',
      'Hot take: the people loudest about this understand it the least.',
      isOpinion ? 'Respectfully, the opposite is also true — and more interesting.' : 'Unpopular opinion incoming: the framing here is wrong.',
      'This will age either brilliantly or terribly. No middle ground.',
      'Most people won\'t act on this insight. That\'s what makes it valuable.',
    ],
    educational: [
      isData ? 'Worth noting the methodology matters as much as the numbers.' : 'Great primer. The deeper layer worth exploring: why this pattern repeats.',
      'Context that adds depth: this isn\'t new, it\'s cyclical.',
      isQuestion ? 'The academic literature on this is actually surprisingly clear.' : 'For anyone who wants to go deeper — the first-principles explanation is fascinating.',
      'Thread-worthy topic. The nuance here is often lost in hot takes.',
      'Key mental model this unlocks: systems thinking over event thinking.',
    ],
  };

  const list = templates[tone] || templates.professional;
  return list[Math.floor(Math.random() * list.length)];
}

// ─── Claude (Anthropic) ───────────────────────────────────────────────────────

async function callClaude(req: LLMRequest): Promise<LLMResponse> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': req.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.maxTokens ?? 150,
      system: req.systemPrompt,
      messages: [{ role: 'user', content: req.userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Claude API error ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const text = (data.content?.[0]?.text ?? '').trim();
  const tokens = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);

  return { text, tokens_used: tokens, model: req.model, provider: 'claude' };
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────

async function callOpenAI(req: LLMRequest): Promise<LLMResponse> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${req.apiKey}`,
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.maxTokens ?? 150,
      temperature: req.temperature ?? 0.8,
      messages: [
        { role: 'system', content: req.systemPrompt },
        { role: 'user', content: req.userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenAI API error ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const text = (data.choices?.[0]?.message?.content ?? '').trim();
  const tokens = data.usage?.total_tokens ?? 0;

  return { text, tokens_used: tokens, model: req.model, provider: 'openai' };
}

// ─── Grok (xAI) — OpenAI-compatible ─────────────────────────────────────────

async function callGrok(req: LLMRequest): Promise<LLMResponse> {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${req.apiKey}`,
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.maxTokens ?? 150,
      temperature: req.temperature ?? 0.8,
      messages: [
        { role: 'system', content: req.systemPrompt },
        { role: 'user', content: req.userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Grok API error ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const text = (data.choices?.[0]?.message?.content ?? '').trim();
  const tokens = data.usage?.total_tokens ?? 0;

  return { text, tokens_used: tokens, model: req.model, provider: 'grok' };
}

// ─── Gemini (Google) ─────────────────────────────────────────────────────────

async function callGemini(req: LLMRequest): Promise<LLMResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${req.model}:generateContent?key=${req.apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: req.systemPrompt }] },
      contents: [{ parts: [{ text: req.userMessage }] }],
      generationConfig: {
        maxOutputTokens: req.maxTokens ?? 150,
        temperature: req.temperature ?? 0.8,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini API error ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
  const tokens = data.usageMetadata?.totalTokenCount ?? 0;

  return { text, tokens_used: tokens, model: req.model, provider: 'gemini' };
}

// ─── DeepSeek — OpenAI-compatible ────────────────────────────────────────────

async function callDeepSeek(req: LLMRequest): Promise<LLMResponse> {
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${req.apiKey}`,
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.maxTokens ?? 150,
      temperature: req.temperature ?? 0.8,
      messages: [
        { role: 'system', content: req.systemPrompt },
        { role: 'user', content: req.userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`DeepSeek API error ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const text = (data.choices?.[0]?.message?.content ?? '').trim();
  const tokens = data.usage?.total_tokens ?? 0;

  return { text, tokens_used: tokens, model: req.model, provider: 'deepseek' };
}
