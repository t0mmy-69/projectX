import { NextRequest, NextResponse } from 'next/server';
import { memoryDB, ScrapedPost, ViralScore, PostCategory } from '@/lib/db';
import { calculateViralScore, shouldIgnorePost, roundViralScore } from '@/lib/viralScore';
import { classifyPost } from '@/lib/categoryEngine';
import { getUserId } from '@/lib/getUser';

// GET /api/posts - Get viral feed for user's topics
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const topicId = request.nextUrl.searchParams.get('topic_id');
    const sortBy = request.nextUrl.searchParams.get('sort_by') || 'viral_score'; // viral_score, recent, trending

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    // Get user's topics
    const userTopics = Array.from(memoryDB.topics.values()).filter(t => t.user_id === userId);

    if (userTopics.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No topics found'
      });
    }

    // Get posts for user's topics (or specific topic if topicId provided)
    const topicIds = topicId
      ? [topicId]
      : userTopics.map(t => t.id);

    const posts = Array.from(memoryDB.posts.values()).filter(p =>
      topicIds.includes(p.topic_id)
    );

    // Enrich posts with viral scores and categories
    const allScores = Array.from(memoryDB.viralScores.values());
    const allCategories = Array.from(memoryDB.categories.values());
    const enrichedPosts = posts.map(post => {
      const viralScore = allScores.find(s => s.post_id === post.id) || memoryDB.viralScores.get(post.id) || memoryDB.viralScores.get(`score_${post.id}`);
      const category = allCategories.find(c => c.post_id === post.id) || memoryDB.categories.get(post.id) || memoryDB.categories.get(`cat_${post.id}`);

      return {
        ...post,
        viral_score: viralScore?.score || 0,
        category: category?.category || 'unknown',
        engagement_rate: viralScore?.engagement_rate || 0
      };
    });

    // Sort posts
    let sorted = [...enrichedPosts];
    if (sortBy === 'viral_score') {
      sorted.sort((a, b) => b.viral_score - a.viral_score);
    } else if (sortBy === 'recent') {
      sorted.sort((a, b) => b.posted_at.getTime() - a.posted_at.getTime());
    }

    return NextResponse.json({
      success: true,
      data: sorted.slice(0, 50), // Limit to 50 posts
      total: sorted.length
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch posts', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/posts - Scrape and add posts manually (for testing)
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { topic_id, author, content, likes = 0, reposts = 0, replies = 0 } = body;

    if (!topic_id || !author || !content) {
      return NextResponse.json(
        { error: 'topic_id, author, and content are required' },
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

    const now = new Date();
    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create post
    const newPost: ScrapedPost = {
      id: postId,
      topic_id,
      author,
      content,
      likes,
      reposts,
      replies,
      posted_at: now,
      scraped_at: now,
      created_at: now,
      updated_at: now
    };

    memoryDB.posts.set(postId, newPost);

    // Calculate viral score
    const metrics = { likes, reposts, replies, posted_at: now };
    if (!shouldIgnorePost(metrics, now)) {
      const viralScore = calculateViralScore(metrics);
      const now_date = new Date();
      const scoreRecord: ViralScore = {
        id: `score_${postId}`,
        post_id: postId,
        score: roundViralScore(viralScore),
        engagement_rate: ((likes + reposts + replies) / 1000) * 100, // Assume 1k followers
        calculated_at: now_date,
        created_at: now_date,
        updated_at: now_date
      };
      memoryDB.viralScores.set(`score_${postId}`, scoreRecord);
    }

    // Classify post
    const classification = classifyPost(content);
    const categoryRecord: PostCategory = {
      id: `cat_${postId}`,
      post_id: postId,
      category: classification.category,
      confidence: classification.confidence,
      created_at: now,
      updated_at: now
    };
    memoryDB.categories.set(`cat_${postId}`, categoryRecord);

    return NextResponse.json(
      {
        success: true,
        message: 'Post added successfully',
        data: {
          ...newPost,
          viral_score: memoryDB.viralScores.get(`score_${postId}`)?.score || 0,
          category: classification.category
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add post', details: String(error) },
      { status: 500 }
    );
  }
}
