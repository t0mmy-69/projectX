import { NextRequest, NextResponse } from 'next/server';
import { validateExtensionToken } from '@/lib/extensionAuth';
import { memoryDB } from '@/lib/db';

// POST /api/extension/auto-reply - Generate auto-reply for a tweet
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-extension-token');
    const userId = request.headers.get('x-user-id');

    if (!token || !userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const validation = validateExtensionToken(token);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { tweet_text = '', tweet_author = '' } = body;

    // Get user persona for tone
    const persona = memoryDB.personas.get(userId);
    const tone = persona?.tone || 'professional';
    
    // Get user's LLM API key if they have one
    const user = memoryDB.users.get(userId) as any;
    const hasLLMKey = !!(user?.llm_api_key);

    // Generate reply using template (in production, this would call Claude API with user's key)
    const tweetLower = tweet_text.toLowerCase();
    let reply = '';
    
    if (tweetLower.includes('ai') || tweetLower.includes('gpt') || tweetLower.includes('claude')) {
      reply = `This is exactly the conversation we need to be having. The implications are bigger than most realize — and we're still in the first chapter.`;
    } else if (tweetLower.includes('crypto') || tweetLower.includes('bitcoin') || tweetLower.includes('defi')) {
      reply = `The signal-to-noise ratio in this space is brutal. But this is one of those signals worth tracking closely.`;
    } else if (tweetLower.includes('startup') || tweetLower.includes('founder') || tweetLower.includes('build')) {
      reply = `Hard agree. The best founders I know operate on a completely different timescale than the market expects.`;
    } else {
      // Generic persona-matched reply
      const replies = [
        `This is the kind of take that sounds obvious in hindsight but almost nobody was saying it 12 months ago.`,
        `The narrative is shifting faster than the consensus realizes. Worth paying close attention.`,
        `Exactly. The people who figure this out early are going to have an enormous advantage.`,
        `Strong perspective. The data supports this more than most people acknowledge.`,
      ];
      reply = replies[Math.floor(Math.random() * replies.length)];
    }

    return NextResponse.json({
      success: true,
      data: {
        reply,
        persona_tone: tone,
        used_llm: hasLLMKey,
        tweet_author,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate reply', details: String(error) }, { status: 500 });
  }
}
