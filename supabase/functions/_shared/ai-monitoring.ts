/**
 * AXIOM:1 COMPLIANT AI MONITORING
 *
 * Observability and monitoring for AI operations:
 * - Token usage tracking
 * - Cost monitoring
 * - Performance metrics
 * - Error tracking
 * - Provider health
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

export interface AIMetrics {
  provider: string;
  model: string;
  endpoint: string;
  latency_ms: number;
  tokens_prompt: number;
  tokens_completion: number;
  tokens_total: number;
  cost_usd: number;
  cached: boolean;
  success: boolean;
  error?: string;
  timestamp: string;
}

/**
 * Log AI metrics to database for observability
 */
export async function logAIMetrics(metrics: AIMetrics): Promise<void> {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Supabase not configured, skipping metrics logging');
      return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    await supabase.from('ai_metrics').insert({
      provider: metrics.provider,
      model: metrics.model,
      endpoint: metrics.endpoint,
      latency_ms: metrics.latency_ms,
      tokens_prompt: metrics.tokens_prompt,
      tokens_completion: metrics.tokens_completion,
      tokens_total: metrics.tokens_total,
      cost_usd: metrics.cost_usd,
      cached: metrics.cached,
      success: metrics.success,
      error: metrics.error,
      created_at: metrics.timestamp,
    });

    // Also log to console for real-time monitoring
    console.info('AI_METRICS', metrics);
  } catch (error) {
    console.error('Failed to log AI metrics:', error);
    // Don't throw - metrics logging should not break the main flow
  }
}

/**
 * Get aggregated AI metrics for monitoring dashboard
 */
export async function getAIMetricsSummary(hours: number = 24): Promise<{
  totalRequests: number;
  totalCost: number;
  avgLatency: number;
  errorRate: number;
  providerBreakdown: Record<string, { requests: number; cost: number }>;
}> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase not configured');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('ai_metrics')
    .select('*')
    .gte('created_at', since);

  if (error) {
    throw new Error(`Failed to fetch metrics: ${error.message}`);
  }

  const metrics = data || [];
  const totalRequests = metrics.length;
  const totalCost = metrics.reduce((sum, m) => sum + (m.cost_usd || 0), 0);
  const avgLatency = metrics.reduce((sum, m) => sum + (m.latency_ms || 0), 0) / totalRequests;
  const errorCount = metrics.filter(m => !m.success).length;
  const errorRate = errorCount / totalRequests;

  const providerBreakdown: Record<string, { requests: number; cost: number }> = {};
  for (const metric of metrics) {
    if (!providerBreakdown[metric.provider]) {
      providerBreakdown[metric.provider] = { requests: 0, cost: 0 };
    }
    providerBreakdown[metric.provider].requests++;
    providerBreakdown[metric.provider].cost += metric.cost_usd || 0;
  }

  return {
    totalRequests,
    totalCost,
    avgLatency,
    errorRate,
    providerBreakdown,
  };
}

/**
 * Check if cost cap is exceeded
 */
export async function checkCostCap(capUSD: number, hours: number = 24): Promise<{
  exceeded: boolean;
  currentCost: number;
  cap: number;
}> {
  const summary = await getAIMetricsSummary(hours);

  return {
    exceeded: summary.totalCost > capUSD,
    currentCost: summary.totalCost,
    cap: capUSD,
  };
}

/**
 * Alert on anomalies (cost spike, high error rate, etc.)
 */
export async function checkAnomalies(): Promise<Array<{
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}>> {
  const alerts: Array<{ type: string; severity: 'low' | 'medium' | 'high'; message: string }> = [];

  try {
    const summary = await getAIMetricsSummary(1); // Last hour

    // High error rate
    if (summary.errorRate > 0.1) {
      alerts.push({
        type: 'high_error_rate',
        severity: 'high',
        message: `Error rate is ${(summary.errorRate * 100).toFixed(1)}% (threshold: 10%)`,
      });
    }

    // High latency
    if (summary.avgLatency > 5000) {
      alerts.push({
        type: 'high_latency',
        severity: 'medium',
        message: `Average latency is ${summary.avgLatency.toFixed(0)}ms (threshold: 5000ms)`,
      });
    }

    // Cost spike
    const dailySummary = await getAIMetricsSummary(24);
    const hourlyCost = summary.totalCost;
    const projectedDailyCost = hourlyCost * 24;
    const actualDailyCost = dailySummary.totalCost;

    if (projectedDailyCost > actualDailyCost * 2) {
      alerts.push({
        type: 'cost_spike',
        severity: 'high',
        message: `Cost spike detected: $${hourlyCost.toFixed(2)}/hr (projected daily: $${projectedDailyCost.toFixed(2)})`,
      });
    }

  } catch (error) {
    console.error('Failed to check anomalies:', error);
  }

  return alerts;
}
