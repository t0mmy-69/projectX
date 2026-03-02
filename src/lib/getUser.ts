// Robust user ID extraction — works without middleware header forwarding
// Tries: JWT Bearer token -> extension token -> cookie -> x-user-id (as last fallback)

import { NextRequest } from 'next/server';
import { validateExtensionToken } from './extensionAuth';

export function getUserId(request: NextRequest): string | null {
  // 1. Decode from JWT Bearer token
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const uid = decodeUserIdFromJWT(auth.slice(7));
    if (uid) return uid;
  }

  // 2. Extension token
  const extToken = request.headers.get('x-extension-token');
  if (extToken) {
    const validation = validateExtensionToken(extToken);
    if (validation.valid && validation.userId) return validation.userId;
  }

  // 3. Cookie fallback (set by login endpoint)
  const cookie = request.cookies.get('user_id');
  if (cookie?.value) return cookie.value;

  // 4. Header fallback (kept for compatibility with middleware-injected headers)
  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId) return headerUserId;

  return null;
}

function decodeUserIdFromJWT(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    const data = JSON.parse(payload);
    return data.user_id || null;
  } catch {
    return null;
  }
}
