// JWT token validation endpoint
// Validates and returns token information

import { NextRequest, NextResponse } from 'next/server';
import { validateJWT, isTokenExpired } from '@/lib/auth';

// GET /api/auth/validate - Validate token from Authorization header
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Missing Authorization header' },
        { status: 400 }
      );
    }

    const validation = validateJWT(token);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, error: validation.error, expired: isTokenExpired(token) },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      user_id: validation.payload?.user_id,
      email: validation.payload?.email,
      name: validation.payload?.name,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Token validation failed', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/auth/validate - Validate token from body or header
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body.token || request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token in request body or Authorization header' },
        { status: 400 }
      );
    }

    // Validate token
    const validation = validateJWT(token);

    if (!validation.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: validation.error,
          expired: isTokenExpired(token),
        },
        { status: 401 }
      );
    }

    // Token is valid
    return NextResponse.json(
      {
        valid: true,
        user_id: validation.payload?.user_id,
        email: validation.payload?.email,
        name: validation.payload?.name,
        x_user_id: validation.payload?.x_user_id,
        expiresAt: new Date((validation.payload?.exp || 0) * 1000),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Auth] Validation error:', error);
    return NextResponse.json(
      { error: 'Token validation failed', details: error.message },
      { status: 500 }
    );
  }
}
