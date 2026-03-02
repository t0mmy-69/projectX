import { NextRequest, NextResponse } from 'next/server';
import { generateJWT } from '@/lib/auth';
import { memoryDB } from '@/lib/db';
import crypto from 'crypto';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, firstName, lastName } = body;

    if (!email || !password || (!name && !firstName)) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    const fullName = name || `${firstName || ''} ${lastName || ''}`.trim();

    // Check if email already exists
    const existingUser = Array.from(memoryDB.users.values()).find(u => u.email === email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newUser = {
      id: userId,
      email,
      name: fullName,
      password_hash: hashPassword(password),
      subscription_tier: 'free' as const,
      created_at: now,
      updated_at: now
    };

    memoryDB.users.set(userId, newUser as any);
    memoryDB.usersByEmail.set(email, userId);

    const authToken = generateJWT({ user_id: userId, email, name: fullName });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        data: {
          token: authToken.token,
          user_id: userId,
          email,
          name: fullName,
          expiresAt: authToken.expiresAt,
        },
      },
      { status: 201 }
    );

    response.cookies.set('auth_token', authToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('user_id', userId, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[Auth] Register error:', error);
    return NextResponse.json(
      { error: 'Registration failed', details: error.message },
      { status: 500 }
    );
  }
}
