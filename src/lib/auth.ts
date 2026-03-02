// Authentication utilities for NarrativeOS
// Supports OAuth 2.0 for X and JWT for user sessions

import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_production_32chars';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

export interface UserPayload {
  user_id: string;
  x_user_id?: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface AuthToken {
  token: string;
  expiresAt: Date;
  expiresIn: string;
}

/**
 * Generate JWT token for authenticated user
 */
export function generateJWT(payload: Omit<UserPayload, 'iat' | 'exp'>): AuthToken {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY as any,
    algorithm: 'HS256',
  });

  // Parse expiry time
  const decoded = jwt.decode(token) as any;
  const expiresAt = new Date(decoded.exp * 1000);

  return {
    token,
    expiresAt,
    expiresIn: JWT_EXPIRY,
  };
}

/**
 * Validate and decode JWT token
 */
export function validateJWT(token: string): { valid: boolean; payload?: UserPayload; error?: string } {
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as UserPayload;
    return { valid: true, payload };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Extract user ID from JWT token (without validation, for quick checks)
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    const payload = jwt.decode(token) as any;
    return payload?.user_id || null;
  } catch {
    return null;
  }
}

/**
 * Generate X OAuth state parameter for CSRF protection
 */
export function generateOAuthState(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Generate X OAuth authorization URL
 */
export function getXOAuthURL(state: string): string {
  const { getAPIKey } = require('./apiKeyManager');

  let clientId = getAPIKey('X_CLIENT_ID');
  if (!clientId) {
    clientId = process.env.X_CLIENT_ID || '';
  }

  let redirectUri = getAPIKey('X_REDIRECT_URI');
  if (!redirectUri) {
    redirectUri = process.env.X_REDIRECT_URI || 'http://localhost:3001/api/auth/x/callback';
  }

  redirectUri = encodeURIComponent(redirectUri);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: decodeURIComponent(redirectUri),
    scope: 'tweet.read users.read offline.access',
    state,
    code_challenge: state, // PKCE challenge
    code_challenge_method: 'plain',
  });

  return `https://twitter.com/i/oauth2/authorize?${params}`;
}

/**
 * Exchange X OAuth code for access token
 */
export async function exchangeXOAuthCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  user?: {
    id: string;
    username: string;
    name: string;
  };
}> {
  const { getAPIKey } = require('./apiKeyManager');

  let clientId = getAPIKey('X_CLIENT_ID');
  if (!clientId) {
    clientId = process.env.X_CLIENT_ID;
  }

  let clientSecret = getAPIKey('X_CLIENT_SECRET');
  if (!clientSecret) {
    clientSecret = process.env.X_CLIENT_SECRET;
  }

  let redirectUri = getAPIKey('X_REDIRECT_URI');
  if (!redirectUri) {
    redirectUri = process.env.X_REDIRECT_URI;
  }

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing X OAuth environment variables');
  }

  const response = await fetch('https://twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code_verifier: code, // PKCE verifier
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`X OAuth error: ${error.error} - ${error.error_description}`);
  }

  return response.json();
}

/**
 * Get X user info from access token
 */
export async function getXUserInfo(accessToken: string): Promise<{
  id: string;
  username: string;
  name: string;
  email?: string;
}> {
  const response = await fetch('https://api.twitter.com/2/users/me?user.fields=created_at,public_metrics', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get X user info: ${error.detail}`);
  }

  const data = await response.json();
  return {
    id: data.data.id,
    username: data.data.username,
    name: data.data.name,
    email: data.data.email,
  };
}

/**
 * Verify token format and basic validity
 */
export function isValidToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  if (!token.includes('.')) return false; // JWT has 3 parts separated by dots
  return true;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = jwt.decode(token) as any;
    if (!payload?.exp) return true;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}
