// Lightweight middleware - Edge Runtime compatible (no Node.js imports)
// Full JWT validation is handled by individual API routes

import { NextRequest, NextResponse } from 'next/server';

// Routes accessible without any token
const PUBLIC_ROUTES = [
  '/api/auth',
  '/api/demo',
  '/api/scrape/health',
  '/login',
  '/signup',
  '/auth',
  '/',
];

// Routes that require a token to be present
const PROTECTED_ROUTES = [
  '/api/topics',
  '/api/posts',
  '/api/drafts',
  '/api/automation',
  '/api/auto-reply',
  '/api/scrape',
  '/api/extension',
  '/api/user',
  '/api/admin',
  '/api/accounts',
  '/api/teams',
  '/api/workspaces',
  '/api/analytics',
  '/api/narratives',
  '/dashboard',
  '/admin',
  '/settings',
  '/viral-feed',
  '/draft-studio',
  '/topics',
  '/automation',
  '/onboarding',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

function getTokenFromRequest(request: NextRequest): string | null {
  // Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // Extension token header
  const extensionToken = request.headers.get('x-extension-token');
  if (extensionToken) return extensionToken;

  // Cookie
  const tokenCookie = request.cookies.get('auth_token');
  if (tokenCookie?.value) return tokenCookie.value;

  return null;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (isProtectedRoute(pathname)) {
    const token = getTokenFromRequest(request);

    // Also accept x-user-id header directly (used by frontend localStorage auth)
    const userId = request.headers.get('x-user-id');

    if (!token && !userId) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized: Missing authentication token' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
