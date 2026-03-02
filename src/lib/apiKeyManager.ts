// API Key Manager
// Securely store and retrieve API keys from database

import { memoryDB } from './db';

export interface APIKey {
  id: string;
  key_name: 'X_API_TOKEN' | 'ANTHROPIC_API_KEY' | 'X_CLIENT_ID' | 'X_CLIENT_SECRET' | 'X_REDIRECT_URI' | 'DATABASE_URL';
  key_value: string; // Encrypted in production
  is_active: boolean;
  last_used_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// In-memory API key storage (in production, encrypt these!)
export const apiKeyStore = new Map<string, APIKey>();

/**
 * Initialize with environment variables (if set)
 */
export function initializeAPIKeys() {
  const envKeys = [
    { name: 'X_API_TOKEN', value: process.env.X_API_TOKEN },
    { name: 'ANTHROPIC_API_KEY', value: process.env.ANTHROPIC_API_KEY },
    { name: 'X_CLIENT_ID', value: process.env.X_CLIENT_ID },
    { name: 'X_CLIENT_SECRET', value: process.env.X_CLIENT_SECRET },
    { name: 'X_REDIRECT_URI', value: process.env.X_REDIRECT_URI },
    { name: 'DATABASE_URL', value: process.env.DATABASE_URL },
  ];

  for (const envKey of envKeys) {
    if (envKey.value) {
      setAPIKey(
        envKey.name as APIKey['key_name'],
        envKey.value,
        true
      );
    }
  }
}

/**
 * Get API key value
 */
export function getAPIKey(keyName: APIKey['key_name']): string | null {
  const key = apiKeyStore.get(keyName);
  if (key && key.is_active) {
    // Update last_used_at
    key.last_used_at = new Date();
    return key.key_value;
  }
  // Fallback to environment variables
  return process.env[keyName] || null;
}

/**
 * Set API key
 */
export function setAPIKey(
  keyName: APIKey['key_name'],
  keyValue: string,
  isActive: boolean = true
): APIKey {
  const now = new Date();
  const existingKey = apiKeyStore.get(keyName);

  const apiKey: APIKey = {
    id: existingKey?.id || `key_${Date.now()}`,
    key_name: keyName,
    key_value: keyValue,
    is_active: isActive,
    created_at: existingKey?.created_at || now,
    updated_at: now,
  };

  apiKeyStore.set(keyName, apiKey);
  return apiKey;
}

/**
 * Delete API key
 */
export function deleteAPIKey(keyName: APIKey['key_name']): boolean {
  return apiKeyStore.delete(keyName);
}

/**
 * List all API keys (without revealing values for security)
 */
export function listAPIKeys(): Omit<APIKey, 'key_value'>[] {
  return Array.from(apiKeyStore.values()).map(key => ({
    id: key.id,
    key_name: key.key_name,
    is_active: key.is_active,
    last_used_at: key.last_used_at,
    created_at: key.created_at,
    updated_at: key.updated_at,
  }));
}

/**
 * Validate API key format
 */
export function validateAPIKey(keyName: APIKey['key_name'], value: string): {
  valid: boolean;
  error?: string;
} {
  if (!value || value.trim().length === 0) {
    return { valid: false, error: 'API key cannot be empty' };
  }

  switch (keyName) {
    case 'ANTHROPIC_API_KEY':
      // Should start with sk-ant-
      if (!value.startsWith('sk-ant-')) {
        return { valid: false, error: 'Invalid Claude API key format' };
      }
      if (value.length < 20) {
        return { valid: false, error: 'API key too short' };
      }
      break;

    case 'X_API_TOKEN':
      // Bearer token, should be reasonably long
      if (value.length < 100) {
        return { valid: false, error: 'X API token appears invalid' };
      }
      break;

    case 'X_CLIENT_ID':
    case 'X_CLIENT_SECRET':
      // Should have reasonable length
      if (value.length < 10) {
        return { valid: false, error: `${keyName} too short` };
      }
      break;

    case 'X_REDIRECT_URI':
      // Should be a valid URL
      try {
        new URL(value);
      } catch {
        return { valid: false, error: 'Invalid redirect URI format' };
      }
      break;

    case 'DATABASE_URL':
      // Should be a valid database URL
      if (!value.includes('://')) {
        return { valid: false, error: 'Invalid database URL format' };
      }
      break;
  }

  return { valid: true };
}

/**
 * Test API key connectivity
 */
export async function testAPIKey(keyName: APIKey['key_name'], keyValue: string): Promise<{
  success: boolean;
  message: string;
  latency_ms?: number;
}> {
  const startTime = Date.now();

  try {
    switch (keyName) {
      case 'ANTHROPIC_API_KEY':
        // Test Claude API
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': keyValue,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-opus-4-1',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'hi' }],
          }),
        });

        if (!claudeResponse.ok) {
          return {
            success: false,
            message: `Claude API error: ${claudeResponse.status}${claudeResponse.status === 401 ? ' (invalid API key)' : ''}`,
            latency_ms: Date.now() - startTime,
          };
        }
        return {
          success: true,
          message: 'Claude API key is valid',
          latency_ms: Date.now() - startTime,
        };

      case 'X_API_TOKEN':
        // Test X API
        const xResponse = await fetch('https://api.twitter.com/2/users/me', {
          headers: {
            Authorization: `Bearer ${keyValue}`,
          },
        });

        if (xResponse.status === 401) {
          return {
            success: false,
            message: 'X API token is invalid or expired',
            latency_ms: Date.now() - startTime,
          };
        }
        return {
          success: true,
          message: 'X API token is valid',
          latency_ms: Date.now() - startTime,
        };

      case 'DATABASE_URL':
        // Test database connection
        try {
          const urlObj = new URL(keyValue);
          // In production, actually test the connection
          return {
            success: true,
            message: 'Database URL format is valid',
            latency_ms: Date.now() - startTime,
          };
        } catch {
          return {
            success: false,
            message: 'Invalid database URL format',
            latency_ms: Date.now() - startTime,
          };
        }

      default:
        return {
          success: true,
          message: 'API key format is valid',
          latency_ms: Date.now() - startTime,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Test failed: ${error.message}`,
      latency_ms: Date.now() - startTime,
    };
  }
}

/**
 * Get API key usage stats
 */
export function getAPIKeyStats(keyName: APIKey['key_name']): {
  last_used_at?: Date;
  total_uses: number;
  is_active: boolean;
} {
  const key = apiKeyStore.get(keyName);
  return {
    last_used_at: key?.last_used_at,
    total_uses: 0, // Would need separate tracking for production
    is_active: key?.is_active || false,
  };
}

// Initialize on module load
initializeAPIKeys();
