import { NextRequest, NextResponse } from 'next/server';
import { memoryDB, AutoReplyRule } from '@/lib/db';
import { checkAutoReplySafety, getReplyRecommendation } from '@/lib/autoReplaySafety';
import { getUserId } from '@/lib/getUser';

// GET /api/auto-reply - Get user's auto-reply rules
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const userRules = Array.from(memoryDB.autoReplyRules.values()).filter(
      r => r.user_id === userId
    );

    return NextResponse.json({
      success: true,
      data: userRules
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch auto-reply rules', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/auto-reply - Create or update auto-reply rule
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
    const {
      trigger_category,
      trigger_viral_score_min,
      trigger_topic_match,
      exclude_meme = true,
      reply_mode = 'template',
      reply_template = '',
      max_replies_per_hour = 10,
      cooldown_minutes = 5,
      require_manual_confirm = true
    } = body;

    if (!reply_mode) {
      return NextResponse.json(
        { error: 'reply_mode is required' },
        { status: 400 }
      );
    }

    const ruleId = `auto_reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newRule: AutoReplyRule = {
      id: ruleId,
      user_id: userId,
      trigger_category,
      trigger_viral_score_min,
      trigger_topic_match,
      exclude_meme,
      reply_mode: reply_mode as any,
      reply_template,
      max_replies_per_hour,
      cooldown_minutes,
      require_manual_confirm,
      is_active: true,
      created_at: now,
      updated_at: now
    };

    memoryDB.autoReplyRules.set(ruleId, newRule);

    return NextResponse.json(
      {
        success: true,
        message: 'Auto-reply rule created successfully',
        data: newRule
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create auto-reply rule', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/auto-reply/validate - Validate a proposed reply before sending
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { post_id, proposed_reply, rule_id } = body;

    if (!post_id || !proposed_reply) {
      return NextResponse.json(
        { error: 'post_id and proposed_reply are required' },
        { status: 400 }
      );
    }

    // Get the auto-reply rule
    const rule = rule_id ? memoryDB.autoReplyRules.get(rule_id) : null;
    if (rule_id && (!rule || rule.user_id !== userId)) {
      return NextResponse.json(
        { error: 'Rule not found or access denied' },
        { status: 403 }
      );
    }

    // Check safety
    const safetyCheck = checkAutoReplySafety({
      userId,
      postId: post_id,
      proposedReply: proposed_reply,
      timestamp: new Date()
    });

    const recommendation = getReplyRecommendation(
      safetyCheck,
      rule?.require_manual_confirm || false
    );

    return NextResponse.json({
      success: true,
      data: {
        is_safe: safetyCheck.isSafe,
        recommendation,
        warnings: safetyCheck.warnings,
        requires_confirmation: rule?.require_manual_confirm || false
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to validate reply', details: String(error) },
      { status: 500 }
    );
  }
}
