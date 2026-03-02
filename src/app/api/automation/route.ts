import { NextRequest, NextResponse } from 'next/server';
import { memoryDB, AutomationRule } from '@/lib/db';
import { getUserId } from '@/lib/getUser';

// GET /api/automation - List automation rules
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const userRules = Array.from(memoryDB.automationRules.values()).filter(
      r => r.user_id === userId
    );

    return NextResponse.json({
      success: true,
      data: userRules
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch rules', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/automation - Create automation rule
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
    const { condition_type, condition_value, action_type } = body;

    if (!condition_type || !condition_value || !action_type) {
      return NextResponse.json(
        { error: 'condition_type, condition_value, and action_type are required' },
        { status: 400 }
      );
    }

    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newRule: AutomationRule = {
      id: ruleId,
      user_id: userId,
      condition_type: condition_type as any,
      condition_value,
      action_type: action_type as any,
      is_active: true,
      created_at: now,
      updated_at: now
    };

    memoryDB.automationRules.set(ruleId, newRule);

    return NextResponse.json(
      {
        success: true,
        message: 'Rule created successfully',
        data: newRule
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create rule', details: String(error) },
      { status: 500 }
    );
  }
}
