// Robust user ID extraction — works without middleware header forwarding
// Tries: x-user-id header → JWT Bearer token → cookie (in that order)

import { NextRequest } from 'next/server';

export function getUserId(request: NextRequest): string | null {
  // 1. Direct header from client (sent by getAuthHeaders() in frontend)
  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId) return headerUserId;

  // 2. Decode from JWT Bearer token (doesn't need Node.js crypto — pure base64)
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const uid = decodeUserIdFromJWT(auth.slice(7));
    if (uid) return uid;
  }

  // 3. Extension token
  const extToken = request.headers.get('x-extension-token');
  if (extToken) {
    const uid = decodeUserIdFromJWT(extToken);
    if (uid) return uid;
  }

  // 4. Cookie fallback (set by login/demo endpoints)
  const cookie = request.cookies.get('user_id');
  if (cookie?.value) return cookie.value;

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
