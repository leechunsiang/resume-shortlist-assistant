/**
 * Client-safe API usage utilities
 * This file contains only utility functions that can be safely used in client components.
 * It does NOT import any server-only modules like openai.
 */

/**
 * OpenAI GPT-4.1-nano pricing (as of November 2024)
 * Prices are per 1M tokens in USD
 */
const PRICING = {
  'gpt-4.1-nano': {
    input: 0.10,   // $0.10 per 1M input tokens
    output: 0.40,  // $0.40 per 1M output tokens
  },
  'gpt-4': {
    input: 30.00,  // $30 per 1M input tokens
    output: 60.00, // $60 per 1M output tokens
  },
};

export interface UsageSummary {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byEndpoint?: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
  byUser?: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
}

/**
 * Calculate cost based on token usage and model pricing
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): { inputCost: number; outputCost: number; totalCost: number } {
  const pricing = PRICING[model as keyof typeof PRICING] || PRICING['gpt-4.1-nano'];

  // Convert tokens to millions and multiply by price
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;

  return {
    inputCost: parseFloat(inputCost.toFixed(6)),
    outputCost: parseFloat(outputCost.toFixed(6)),
    totalCost: parseFloat(totalCost.toFixed(6)),
  };
}

/**
 * Export usage logs to CSV
 */
export function exportUsageLogsToCSV(logs: any[]): string {
  if (logs.length === 0) return '';

  const headers = [
    'Date',
    'User ID',
    'Endpoint',
    'Model',
    'Input Tokens',
    'Output Tokens',
    'Total Tokens',
    'Total Cost (USD)',
    'Success',
    'Response Time (ms)',
  ];

  const rows = logs.map(log => [
    new Date(log.created_at).toLocaleString(),
    log.user_id,
    log.endpoint,
    log.model,
    log.input_tokens,
    log.output_tokens,
    log.total_tokens,
    `$${log.total_cost.toFixed(6)}`,
    log.success ? 'Yes' : 'No',
    log.response_time_ms || 'N/A',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Helper to format cost as currency
 */
export function formatCost(cost: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(cost);
}

/**
 * Helper to format token count
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  } else if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(2)}K`;
  }
  return tokens.toString();
}
