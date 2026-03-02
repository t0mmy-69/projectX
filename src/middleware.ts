// Lightweight Edge-compatible middleware
// Decodes JWT payload (no Node.js) to extract user_id and forward to API routes

import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = [
  '/api/auth',
  '/api/demo',
  '/api/scrape/health',
  '/login',
  '/signup',
  '/auth',
  '/',
];

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
  return PUBLIC_ROUTES.some(route => route === '/' ? pathname === '/' : pathname.startsWith(route));
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  const extensionToken = request.headers.get('x-extension-token');
  if (extensionToken) return extensionToken;
  const tokenCookie = request.cookies.get('auth_token');
  if (tokenCookie?.value) return tokenCookie.value;
  return null;
}

// Edge-compatible JWT decode: base64-decode the payload, no Node.js needed
function decodeJWTPayload(token: string): { user_id?: string; email?: string; name?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Standard base64url → base64
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // Pad to multiple of 4
    while (payload.length % 4 !== 0) payload += '=';
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (isProtectedRoute(pathname)) {
    const token  = getTokenFromRequest(request);
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

    // Extract user_id from JWT and inject it as x-user-id for downstream routes
    // This means API routes always get x-user-id regardless of how client sends auth
    const requestHeaders = new Headers(request.headers);
    if (token) {
      const payload = decodeJWTPayload(token);
      if (payload?.user_id) {
        requestHeaders.set('x-user-id', payload.user_id);
        if (payload.email) requestHeaders.set('x-user-email', payload.email);
        if (payload.name)  requestHeaders.set('x-user-name', payload.name);
      }
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
