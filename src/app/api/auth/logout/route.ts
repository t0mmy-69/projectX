// Logout endpoint
// Clears authentication cookies

import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json(
    {
      success: true,
      message: 'Logged out successfully',
    },
    { status: 200 }
  );

  // Clear auth cookies
  response.cookies.delete('auth_token');
  response.cookies.delete('user_id');

  return response;
}
