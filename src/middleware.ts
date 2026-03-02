// Authentication middleware for protecting API routes and pages

import { NextRequest, NextResponse } from 'next/server';
import { validateJWT, extractUserIdFromToken } from '@/lib/auth';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth',
  '/api/demo',
  '/api/scrape/health',
  '/login',
  '/signup',
  '/auth',
  '/',
];

// Routes that require authentication
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
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Try x-extension-token header (for extension requests)
  const extensionToken = request.headers.get('x-extension-token');
  if (extensionToken) {
    return extensionToken;
  }

  // Try cookie
  const tokenCookie = request.cookies.get('auth_token');
  if (tokenCookie?.value) {
    return tokenCookie.value;
  }

  return null;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check protected routes
  if (isProtectedRoute(pathname)) {
    const token = getTokenFromRequest(request);

    if (!token) {
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized: Missing authentication token' },
          { status: 401 }
        );
      }

      // For pages, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Validate token
    const validation = validateJWT(token);
    if (!validation.valid) {
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid or expired token' },
          { status: 401 }
        );
      }

      // For pages, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Add user info to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', validation.payload?.user_id || '');
    requestHeaders.set('x-user-email', validation.payload?.email || '');
    requestHeaders.set('x-user-name', validation.payload?.name || '');

    // Create response with modified headers
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
