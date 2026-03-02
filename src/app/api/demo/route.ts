import { NextRequest, NextResponse } from 'next/server';
import { generateJWT } from '@/lib/auth';
import { memoryDB } from '@/lib/db';
import { classifyPost } from '@/lib/categoryEngine';
import crypto from 'crypto';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

const DEMO_POSTS = [
  { author: 'VitalikButerin', content: 'The next wave of Layer 2 solutions will focus on ZK-proofs for everything. Privacy is the killer feature.', likes: 4200, reposts: 890, replies: 340 },
  { author: 'paulg', content: 'The best startups of the next decade will be built by solo founders with AI as their cofounder.', likes: 12000, reposts: 3400, replies: 1200 },
  { author: 'naval', content: 'Specific knowledge cannot be taught. It can only be learned through genuine curiosity and obsession.', likes: 8900, reposts: 2100, replies: 560 },
];

// GET /api/demo - Create and return demo account credentials
export async function GET(request: NextRequest) {
  try {
    const DEMO_EMAIL = 'demo@narrativeos.app';
    const DEMO_PASSWORD = 'demo1234';
    const DEMO_USER_ID = 'demo_user_001';
    const now = new Date();

    // Create demo user if not exists
    let demoUser = memoryDB.users.get(DEMO_USER_ID);
    if (!demoUser) {
      demoUser = {
        id: DEMO_USER_ID,
        email: DEMO_EMAIL,
        name: 'Demo User',
        subscription_tier: 'creator',
        created_at: now,
        updated_at: now,
      } as any;
      (demoUser as any).password_hash = hashPassword(DEMO_PASSWORD);
      memoryDB.users.set(DEMO_USER_ID, demoUser!);

      // Seed demo topics
      const topicKeywords = ['AI Tech & Agents', 'Solana DeFi', 'SaaS Growth'];
      topicKeywords.forEach((kw, i) => {
        const topicId = `demo_topic_${i}`;
        memoryDB.topics.set(topicId, {
          id: topicId,
          user_id: DEMO_USER_ID,
          keyword: kw,
          is_active: true,
          created_at: now,
          updated_at: now,
        });
      });
    }

    // Always (re)seed posts + scores + categories so fresh logins get full data
    DEMO_POSTS.forEach((p, i) => {
      const postId = `demo_post_${i}`;
      const postedAt = new Date(Date.now() - (i + 1) * 30 * 60000);

      memoryDB.posts.set(postId, {
        id: postId,
        topic_id: 'demo_topic_0',
        author: p.author,
        content: p.content,
        likes: p.likes,
        reposts: p.reposts,
        replies: p.replies,
        posted_at: postedAt,
        scraped_at: now,
        created_at: now,
        updated_at: now,
      });

      // Viral score
      const score = (p.likes + 2 * p.reposts + p.replies) / 60;
      memoryDB.viralScores.set(postId, {
        id: `vs_${postId}`,
        post_id: postId,
        score,
        engagement_rate: score / 100,
        calculated_at: now,
        created_at: now,
        updated_at: now,
      });

      // Category classification
      const classification = classifyPost(p.content);
      memoryDB.categories.set(`cat_${postId}`, {
        id: `cat_${postId}`,
        post_id: postId,
        category: classification.category,
        confidence: classification.confidence,
        created_at: now,
        updated_at: now,
      });
    });

    // Generate JWT
    const authToken = generateJWT({
      user_id: DEMO_USER_ID,
      email: DEMO_EMAIL,
      name: 'Demo User',
    });

    const response = NextResponse.json({
      success: true,
      data: {
        token: authToken.token,
        user_id: DEMO_USER_ID,
        email: DEMO_EMAIL,
        name: 'Demo User',
      },
    });

    response.cookies.set('auth_token', authToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('user_id', DEMO_USER_ID, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: 'Demo setup failed', details: error.message }, { status: 500 });
  }
}
