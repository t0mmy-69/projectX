import { NextRequest, NextResponse } from 'next/server';
import { validateExtensionToken } from '@/lib/extensionAuth';
import { memoryDB } from '@/lib/db';
import { getUserId } from '@/lib/getUser';

// POST /api/extension/draft - Generate draft for extension
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-extension-token');
    const userId = getUserId(request);

    if (!token || !userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const validation = validateExtensionToken(token);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { context = '', topic_id } = body;

    // Get user topics
    const userTopics = Array.from(memoryDB.topics.values()).filter(t => t.user_id === userId && t.is_active);
    
    // Get persona
    const persona = memoryDB.personas.get(userId);
    
    // Generate a contextual draft using template engine
    const topic = userTopics[0]?.keyword || 'your topic';
    const contextSnippet = context ? `"${context.slice(0, 100)}"` : '';
    
    let draft = '';
    if (contextSnippet) {
      draft = `Interesting take on ${topic}. ${contextSnippet.length > 50 ? 'Here\'s my perspective:' : ''}\n\nThe real question is: where does this lead us in the next 12 months? The signals are clear for those paying attention.`;
    } else {
      draft = `The narrative around ${topic} is shifting. Most people are focused on the wrong thing.\n\nHere's what actually matters right now:`;
    }

    return NextResponse.json({
      success: true,
      data: {
        draft,
        context_used: !!context,
        topic: userTopics[0]?.keyword,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate draft', details: String(error) }, { status: 500 });
  }
}
