import { NextRequest, NextResponse } from 'next/server';
import { memoryDB, Draft } from '@/lib/db';
import { analyzePersona } from '@/lib/personaEngine';
import { generateContent } from '@/lib/contentGenerator';

// GET /api/drafts - Get user's drafts
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const userDrafts = Array.from(memoryDB.drafts.values()).filter(d => d.user_id === userId);

    return NextResponse.json({
      success: true,
      data: userDrafts
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch drafts', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/drafts/generate - Generate new draft
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { topic_id, post_id, historical_tweets = [], summary = '', category = 'opinion' } = body;

    if (!topic_id) {
      return NextResponse.json(
        { error: 'topic_id is required' },
        { status: 400 }
      );
    }

    // Verify topic belongs to user
    const topic = memoryDB.topics.get(topic_id);
    if (!topic || topic.user_id !== userId) {
      return NextResponse.json(
        { error: 'Topic not found or access denied' },
        { status: 403 }
      );
    }

    // Get or create persona
    let persona = memoryDB.personas.get(userId);
    if (!persona) {
      // Analyze persona from historical tweets
      const analyzedPersona = analyzePersona(historical_tweets);
      const now = new Date();
      persona = {
        id: `persona_${userId}`,
        user_id: userId,
        ...analyzedPersona,
        created_at: now,
        updated_at: now
      };
      memoryDB.personas.set(userId, persona);
    }

    // Build a meaningful summary from topic + recent posts if no summary provided
    let effectiveSummary = summary;
    if (!effectiveSummary) {
      // Look for recent posts on this topic to use as context
      const topicPosts = Array.from(memoryDB.posts.values())
        .filter(p => p.topic_id === topic_id)
        .sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime())
        .slice(0, 3);

      if (topicPosts.length > 0) {
        // Use the most viral post content as inspiration
        const allScores = Array.from(memoryDB.viralScores.values());
        const topPost = topicPosts.reduce((best, p) => {
          const score = allScores.find(s => s.post_id === p.id)?.score || 0;
          const bestScore = allScores.find(s => s.post_id === best.id)?.score || 0;
          return score > bestScore ? p : best;
        }, topicPosts[0]);
        effectiveSummary = topPost.content;
      } else {
        // Fallback: generate a contextual summary based on topic keyword
        const kw = topic.keyword;
        const templates = [
          `The landscape of ${kw} is shifting rapidly. New developments are forcing creators and investors to rethink their strategies.`,
          `${kw} is creating unprecedented opportunities right now. The data shows a clear trend most people are ignoring.`,
          `Here's what the mainstream narrative gets wrong about ${kw}. The real story is far more interesting.`,
          `The next 12 months will define who wins in ${kw}. Here's what separates the leaders from everyone else.`,
        ];
        effectiveSummary = templates[Math.floor(Math.random() * templates.length)];
      }
    }

    // Generate content
    const content = generateContent({
      persona: {
        tone: persona.tone,
        avg_length: persona.avg_length,
        emoji_usage: persona.emoji_usage,
        hook_style: persona.hook_style,
        cta_style: persona.cta_style
      },
      summary: effectiveSummary,
      category,
      topic: topic.keyword
    });

    // Create draft record
    const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const cacheExpiresAt = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours

    const draft: Draft = {
      id: draftId,
      user_id: userId,
      topic_id,
      hook_variation_1: content.hook_variation_1,
      hook_variation_2: content.hook_variation_2,
      hook_variation_3: content.hook_variation_3,
      tweet_draft: content.tweet_draft,
      thread_draft: content.thread_draft,
      based_on_post_id: post_id,
      cache_expires_at: cacheExpiresAt,
      created_at: now,
      updated_at: now
    };

    memoryDB.drafts.set(draftId, draft);

    return NextResponse.json(
      {
        success: true,
        message: 'Draft generated successfully',
        data: draft
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate draft', details: String(error) },
      { status: 500 }
    );
  }
}
