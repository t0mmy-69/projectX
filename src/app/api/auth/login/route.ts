import { NextRequest, NextResponse } from 'next/server';
import { generateJWT } from '@/lib/auth';
import { memoryDB } from '@/lib/db';
import crypto from 'crypto';

function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':');
    const newHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === newHash;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, user_id, name } = body;

    // Support dev mode: if user_id provided directly (for testing), allow it
    if (user_id && !email) {
      const authToken = generateJWT({
        user_id,
        email: email || `${user_id}@narrativeos.app`,
        name: name || user_id,
      });

      const response = NextResponse.json(
        {
          success: true,
          data: { token: authToken.token, user_id, expiresAt: authToken.expiresAt },
        },
        { status: 200 }
      );

      response.cookies.set('auth_token', authToken.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
      response.cookies.set('user_id', user_id, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = Array.from(memoryDB.users.values()).find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const userWithHash = user as any;
    if (!userWithHash.password_hash || !verifyPassword(password, userWithHash.password_hash)) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const authToken = generateJWT({
      user_id: user.id,
      email: user.email,
      name: user.name,
      x_user_id: user.x_user_id,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          token: authToken.token,
          user_id: user.id,
          email: user.email,
          name: user.name,
          expiresAt: authToken.expiresAt,
        },
      },
      { status: 200 }
    );

    response.cookies.set('auth_token', authToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('user_id', user.id, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    );
  }
}
