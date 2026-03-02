// GET/POST /api/user/llm-keys — manage per-user LLM API keys
import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/getUser';
import { memoryDB, UserLLMKey, LLMProvider } from '@/lib/db';

const VALID_PROVIDERS: LLMProvider[] = ['claude', 'openai', 'grok', 'gemini', 'deepseek'];

// GET /api/user/llm-keys — return which providers have keys (masked)
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const keys: Record<string, { has_key: boolean; masked?: string }> = {};

  for (const provider of VALID_PROVIDERS) {
    const stored = memoryDB.userLLMKeys.get(`${userId}_${provider}`);
    if (stored?.api_key) {
      const k = stored.api_key;
      keys[provider] = {
        has_key: true,
        masked: `${k.slice(0, 6)}...${k.slice(-4)}`,
      };
    } else {
      keys[provider] = { has_key: false };
    }
  }

  return NextResponse.json({ success: true, data: keys });
}

// POST /api/user/llm-keys — save or update a provider's API key
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { provider, api_key } = body;

  if (!provider || !VALID_PROVIDERS.includes(provider as LLMProvider))
    return NextResponse.json({ error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` }, { status: 400 });

  if (!api_key?.trim())
    return NextResponse.json({ error: 'api_key is required' }, { status: 400 });

  const keyId = `${userId}_${provider}`;
  const now   = new Date();
  const existing = memoryDB.userLLMKeys.get(keyId);

  const record: UserLLMKey = {
    id: existing?.id || `llmkey_${Date.now()}`,
    user_id: userId,
    provider: provider as LLMProvider,
    api_key: api_key.trim(),
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  memoryDB.userLLMKeys.set(keyId, record);

  return NextResponse.json({
    success: true,
    data: { provider, has_key: true, masked: `${api_key.slice(0, 6)}...${api_key.slice(-4)}` },
  });
}

// DELETE /api/user/llm-keys?provider=xxx — remove a provider's API key
export async function DELETE(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const provider = request.nextUrl.searchParams.get('provider') as LLMProvider;
  if (!provider || !VALID_PROVIDERS.includes(provider))
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });

  memoryDB.userLLMKeys.delete(`${userId}_${provider}`);
  return NextResponse.json({ success: true });
}
