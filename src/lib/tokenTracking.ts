// Token usage tracking for Claude API calls

export interface TokenLog {
  id: string;
  user_id: string;
  function_name: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
  model: string;
  status: 'success' | 'error';
  error_message?: string;
  created_at: Date;
}

// Pricing as of February 2026
const PRICING = {
  'claude-opus-4-6': { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
  'claude-sonnet-4-6': { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
  'claude-haiku-4-5': { input: 0.80 / 1_000_000, output: 4.0 / 1_000_000 }
};

const tokenLogs: Map<string, TokenLog> = new Map();
let totalTokensUsed = 0;
let totalCostAccumulated = 0;

export function logTokenUsage(
  userId: string,
  functionName: string,
  inputTokens: number,
  outputTokens: number,
  model: string = 'claude-opus-4-6',
  status: 'success' | 'error' = 'success',
  errorMessage?: string
): TokenLog {
  const pricing = PRICING[model as keyof typeof PRICING] || PRICING['claude-opus-4-6'];
  const cost = (inputTokens * pricing.input) + (outputTokens * pricing.output);
  const totalTokens = inputTokens + outputTokens;

  const log: TokenLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    function_name: functionName,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
    cost,
    model,
    status,
    error_message: errorMessage,
    created_at: new Date()
  };

  tokenLogs.set(log.id, log);
  totalTokensUsed += totalTokens;
  totalCostAccumulated += cost;

  console.log(
    `[TOKEN TRACKING] ${functionName}: ${totalTokens} tokens (${cost.toFixed(6)}$) - ${status}`
  );

  return log;
}

export function getTokenStats(userId?: string) {
  const logs = Array.from(tokenLogs.values());
  const filtered = userId ? logs.filter(l => l.user_id === userId) : logs;

  const stats = {
    totalTokens: filtered.reduce((sum, log) => sum + log.total_tokens, 0),
    totalCost: filtered.reduce((sum, log) => sum + log.cost, 0),
    byFunction: {} as Record<string, { tokens: number; cost: number; count: number }>,
    byModel: {} as Record<string, { tokens: number; cost: number; count: number }>,
    last24Hours: {} as Record<string, { tokens: number; cost: number; count: number }>,
    successCount: filtered.filter(l => l.status === 'success').length,
    errorCount: filtered.filter(l => l.status === 'error').length
  };

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const log of filtered) {
    // By function
    if (!stats.byFunction[log.function_name]) {
      stats.byFunction[log.function_name] = { tokens: 0, cost: 0, count: 0 };
    }
    stats.byFunction[log.function_name].tokens += log.total_tokens;
    stats.byFunction[log.function_name].cost += log.cost;
    stats.byFunction[log.function_name].count += 1;

    // By model
    if (!stats.byModel[log.model]) {
      stats.byModel[log.model] = { tokens: 0, cost: 0, count: 0 };
    }
    stats.byModel[log.model].tokens += log.total_tokens;
    stats.byModel[log.model].cost += log.cost;
    stats.byModel[log.model].count += 1;

    // Last 24 hours
    if (log.created_at > oneDayAgo) {
      const hour = new Date(log.created_at).getHours();
      const key = `hour_${hour}`;
      if (!stats.last24Hours[key]) {
        stats.last24Hours[key] = { tokens: 0, cost: 0, count: 0 };
      }
      stats.last24Hours[key].tokens += log.total_tokens;
      stats.last24Hours[key].cost += log.cost;
      stats.last24Hours[key].count += 1;
    }
  }

  return stats;
}

export function getAllTokenLogs(): TokenLog[] {
  return Array.from(tokenLogs.values()).sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
}

export function getGlobalStats() {
  return {
    totalTokensUsed,
    totalCostAccumulated,
    averageCostPerToken: totalTokensUsed > 0 ? totalCostAccumulated / totalTokensUsed : 0,
    logCount: tokenLogs.size
  };
}

export function clearOldLogs(olderThanHours: number = 24 * 7) { // Default: 7 days
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  let removed = 0;

  for (const [id, log] of tokenLogs.entries()) {
    if (log.created_at < cutoff) {
      tokenLogs.delete(id);
      removed++;
    }
  }

  console.log(`Cleared ${removed} token logs older than ${olderThanHours} hours`);
  return removed;
}
