// Claude API Client with error handling and retry logic
import Anthropic from '@anthropic-ai/sdk';
import { getAPIKey } from './apiKeyManager';

let client: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!client) {
    // Try to get from API Key Manager first, fallback to env var
    let apiKey = getAPIKey('ANTHROPIC_API_KEY');
    if (!apiKey) {
      apiKey = process.env.ANTHROPIC_API_KEY || null;
    }
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not found. Please configure it in admin panel.');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export interface ClaudeMessageOptions {
  model?: string;
  max_tokens?: number;
  system?: string;
}

export async function callClaude<T>(
  prompt: string,
  options: ClaudeMessageOptions = {},
  parseJson: boolean = true,
  retries: number = 3
): Promise<T> {
  const {
    model = 'claude-opus-4-6',
    max_tokens = 2000,
    system = ''
  } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const claudeClient = getClaudeClient();

      const messages: Anthropic.MessageParam[] = [{
        role: 'user',
        content: prompt
      }];

      const message = await claudeClient.messages.create({
        model,
        max_tokens,
        messages,
        ...(system && { system })
      });

      const content = message.content[0];

      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      if (parseJson) {
        try {
          return JSON.parse(content.text) as T;
        } catch (parseError) {
          console.error('Failed to parse Claude response as JSON:', content.text);
          throw new Error(`Invalid JSON response from Claude: ${String(parseError)}`);
        }
      }

      return content.text as unknown as T;
    } catch (error) {
      const isRateLimited = error instanceof Anthropic.RateLimitError;
      const isLastAttempt = attempt === retries;

      if (isRateLimited && !isLastAttempt) {
        // Exponential backoff for rate limits
        const waitMs = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        console.warn(`Rate limited, retrying in ${waitMs}ms (attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }

      if (isLastAttempt) {
        console.error('Claude API error after retries:', error);
        throw error;
      }

      // For other errors, apply exponential backoff
      const waitMs = 1000 * Math.pow(2, attempt - 1);
      console.warn(`Claude error, retrying in ${waitMs}ms (attempt ${attempt}/${retries}):`, String(error));
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }

  throw new Error(`Failed to call Claude after ${retries} attempts`);
}

export async function isClaudeAvailable(): Promise<boolean> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return false;
    }
    // Try a simple API call to verify
    await callClaude('Test', { max_tokens: 10 }, false, 1);
    return true;
  } catch (error) {
    console.error('Claude API not available:', error);
    return false;
  }
}
