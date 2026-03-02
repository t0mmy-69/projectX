// X OAuth 2.0 callback handler
// Handles authorization code exchange and user creation/update

import { NextRequest, NextResponse } from 'next/server';
import { exchangeXOAuthCode, getXUserInfo, generateJWT } from '@/lib/auth';
import { memoryDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth error
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'Unknown error';
      return NextResponse.redirect(
        new URL(`/auth/error?error=${error}&description=${errorDescription}`, request.url)
      );
    }

    // Validate code and state
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/auth/error?error=invalid_request&description=Missing code or state', request.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await exchangeXOAuthCode(code);
    const xUserInfo = await getXUserInfo(tokenResponse.access_token);

    // Create or update user in database
    const userId = `user_${xUserInfo.id}`;
    const existingUser = memoryDB.users.get(userId);

    const user = {
      id: userId,
      x_user_id: xUserInfo.id,
      x_username: xUserInfo.username,
      email: xUserInfo.email || `${xUserInfo.username}@twitter.local`,
      name: xUserInfo.name,
      x_access_token: tokenResponse.access_token,
      x_refresh_token: tokenResponse.refresh_token,
      x_token_expires_at: new Date(Date.now() + tokenResponse.expires_in * 1000),
      subscription_tier: existingUser?.subscription_tier || ('free' as const),
      created_at: existingUser?.created_at || new Date(),
      updated_at: new Date(),
    };

    memoryDB.users.set(userId, user);

    // Generate JWT token
    const jwtToken = generateJWT({
      user_id: userId,
      x_user_id: xUserInfo.id,
      email: user.email,
      name: user.name,
    });

    // Create response with auth cookie
    const response = NextResponse.redirect(
      new URL(`/dashboard?auth_success=true`, request.url)
    );

    // Set httpOnly cookie for secure token storage
    response.cookies.set('auth_token', jwtToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Also set user ID in non-httpOnly cookie for client access
    response.cookies.set('user_id', userId, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[Auth] X OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/auth/error?error=server_error&description=${encodeURIComponent(error.message)}`,
        request.url
      )
    );
  }
}
