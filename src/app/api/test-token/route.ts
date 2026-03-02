// Test-only endpoint for generating JWT token
// Remove this in production!

import { NextRequest, NextResponse } from 'next/server';
import { generateJWT } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Generate test JWT token
    const token = generateJWT({
      user_id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
    });

    return NextResponse.json({
      success: true,
      token: token.token,
      expiresAt: token.expiresAt,
      message: 'Test token generated. Store this in localStorage with key "auth_token"',
      instructions: 'token will be returned below. Copy the token value and:',
      steps: [
        '1. Open browser DevTools (F12)',
        '2. Go to Console tab',
        '3. Run: localStorage.setItem("auth_token", "YOUR_TOKEN_HERE")',
        '4. Refresh the page and navigate to /admin'
      ]
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
