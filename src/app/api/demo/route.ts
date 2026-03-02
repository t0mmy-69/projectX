import { NextResponse } from 'next/server';
import { generateJWT } from '@/lib/auth';

// GET /api/demo - Return demo account credentials
// Demo user + data are pre-seeded in db.ts (works on every cold start / serverless instance)
export async function GET() {
  try {
    const demoEnabled = process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEMO_ACCOUNT === 'true';
    if (!demoEnabled) {
      return NextResponse.json(
        { error: 'Demo mode is disabled' },
        { status: 403 }
      );
    }

    const DEMO_USER_ID = 'demo_user_001';
    const DEMO_EMAIL   = 'demo@narrativeos.app';
    const DEMO_NAME    = 'Demo User';

    const authToken = generateJWT({
      user_id: DEMO_USER_ID,
      email: DEMO_EMAIL,
      name: DEMO_NAME,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        token: authToken.token,
        user_id: DEMO_USER_ID,
        email: DEMO_EMAIL,
        name: DEMO_NAME,
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
    return NextResponse.json(
      { error: 'Demo setup failed', details: error.message },
      { status: 500 }
    );
  }
}
