// Admin API Keys Management
// Add, update, delete, and test API keys from admin panel

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminCheck';
import { getUserId } from '@/lib/getUser';
import {
  listAPIKeys,
  setAPIKey,
  deleteAPIKey,
  validateAPIKey,
  testAPIKey,
  getAPIKey,
} from '@/lib/apiKeyManager';

// GET /api/admin/api-keys - List all API keys
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request) || undefined;

    if (!isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const keys = listAPIKeys();

    return NextResponse.json({
      success: true,
      data: {
        keys,
        required_keys: [
          'X_API_TOKEN',
          'ANTHROPIC_API_KEY',
          'X_CLIENT_ID',
          'X_CLIENT_SECRET',
          'X_REDIRECT_URI',
          'DATABASE_URL',
        ],
        configured_keys: keys.filter(k => k.is_active).length,
      },
    });
  } catch (error: any) {
    console.error('[Admin] API Keys GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/api-keys - Set/Update API key
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request) || undefined;

    if (!isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key_name, key_value, validate_only } = body;

    if (!key_name || !key_value) {
      return NextResponse.json(
        { error: 'Missing key_name or key_value' },
        { status: 400 }
      );
    }

    // Validate API key format
    const validation = validateAPIKey(key_name, key_value);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // If only validating, test the key
    if (validate_only) {
      const testResult = await testAPIKey(key_name, key_value);
      return NextResponse.json({
        success: testResult.success,
        message: testResult.message,
        latency_ms: testResult.latency_ms,
      });
    }

    // Save the key
    const savedKey = setAPIKey(key_name, key_value, true);

    return NextResponse.json(
      {
        success: true,
        message: `API key ${key_name} saved successfully`,
        data: {
          id: savedKey.id,
          key_name: savedKey.key_name,
          is_active: savedKey.is_active,
          updated_at: savedKey.updated_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Admin] API Keys POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save API key', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/api-keys - Test API key
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserId(request) || undefined;

    if (!isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key_name, action } = body;

    if (!key_name) {
      return NextResponse.json(
        { error: 'Missing key_name' },
        { status: 400 }
      );
    }

    if (action === 'test') {
      const keyValue = getAPIKey(key_name as any);
      if (!keyValue) {
        return NextResponse.json(
          { error: 'API key not found' },
          { status: 404 }
        );
      }

      const testResult = await testAPIKey(key_name as any, keyValue);
      return NextResponse.json({
        success: testResult.success,
        message: testResult.message,
        latency_ms: testResult.latency_ms,
      });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Admin] API Keys PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to test API key', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/api-keys - Delete API key
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request) || undefined;

    if (!isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key_name } = body;

    if (!key_name) {
      return NextResponse.json(
        { error: 'Missing key_name' },
        { status: 400 }
      );
    }

    const deleted = deleteAPIKey(key_name as any);

    if (!deleted) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `API key ${key_name} deleted`,
    });
  } catch (error: any) {
    console.error('[Admin] API Keys DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key', details: error.message },
      { status: 500 }
    );
  }
}
