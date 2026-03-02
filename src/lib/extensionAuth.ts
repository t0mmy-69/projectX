// Extension Authentication Module
// Handles extension token generation and validation

import { memoryDB, ExtensionToken } from './db';

const TOKEN_EXPIRATION_HOURS = 24;
const TOKEN_LENGTH = 32;

export function generateExtensionToken(userId: string): ExtensionToken {
  const token = generateSecureToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);

  const extensionToken: ExtensionToken = {
    id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    token,
    expires_at: expiresAt,
    created_at: now,
    updated_at: now
  };

  memoryDB.extensionTokens.set(token, extensionToken);

  return extensionToken;
}

export function validateExtensionToken(token: string): { valid: boolean; userId?: string; message?: string } {
  const extensionToken = memoryDB.extensionTokens.get(token);

  if (!extensionToken) {
    return { valid: false, message: 'Token not found' };
  }

  if (new Date() > extensionToken.expires_at) {
    return { valid: false, message: 'Token expired' };
  }

  return { valid: true, userId: extensionToken.user_id };
}

export function revokeExtensionToken(token: string): boolean {
  return memoryDB.extensionTokens.delete(token);
}

export function revokeAllUserTokens(userId: string): number {
  let count = 0;
  for (const [token, record] of memoryDB.extensionTokens) {
    if (record.user_id === userId) {
      memoryDB.extensionTokens.delete(token);
      count++;
    }
  }
  return count;
}

function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let token = '';
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function isTokenExpired(token: ExtensionToken): boolean {
  return new Date() > token.expires_at;
}
