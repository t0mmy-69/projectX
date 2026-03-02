// User accounts management endpoints
// Handles linking and managing multiple X accounts

import { NextRequest, NextResponse } from 'next/server';
import { memoryDB, UserAccount } from '@/lib/db';
import { getUserId } from '@/lib/getUser';

// GET /api/accounts - List all user accounts
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    // Get all accounts for this user
    const userAccounts = Array.from(memoryDB.userAccounts.values()).filter(
      a => a.user_id === userId
    );

    return NextResponse.json({
      success: true,
      data: userAccounts,
      total: userAccounts.length,
    });
  } catch (error: any) {
    console.error('[Accounts] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/accounts - Link a new X account
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
    const { x_user_id, x_username, x_access_token, x_refresh_token, x_token_expires_at, is_primary } = body;

    // Validate required fields
    if (!x_user_id || !x_username || !x_access_token) {
      return NextResponse.json(
        { error: 'Missing required fields: x_user_id, x_username, x_access_token' },
        { status: 400 }
      );
    }

    // Check if this account is already linked
    const existingAccount = Array.from(memoryDB.userAccounts.values()).find(
      a => a.user_id === userId && a.x_user_id === x_user_id
    );

    if (existingAccount) {
      return NextResponse.json(
        { error: 'This X account is already linked to your profile' },
        { status: 409 }
      );
    }

    // If this is being set as primary, unset other primary accounts
    if (is_primary) {
      const primaryAccounts = Array.from(memoryDB.userAccounts.values()).filter(
        a => a.user_id === userId && a.is_primary
      );

      for (const account of primaryAccounts) {
        account.is_primary = false;
      }
    }

    // Create new account
    const accountId = `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newAccount: UserAccount = {
      id: accountId,
      user_id: userId,
      x_user_id,
      x_username,
      x_access_token,
      x_refresh_token,
      x_token_expires_at: new Date(x_token_expires_at || Date.now() + 2 * 60 * 60 * 1000), // 2 hours default
      is_primary: is_primary || false,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    memoryDB.userAccounts.set(accountId, newAccount);

    return NextResponse.json(
      {
        success: true,
        message: 'Account linked successfully',
        data: newAccount,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Accounts] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to link account', details: error.message },
      { status: 500 }
    );
  }
}
