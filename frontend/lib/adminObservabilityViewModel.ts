import type { LlmPromptOutputPair, MetricsSnapshot, QualitySummary, WorkflowComponentBreakdown } from './observabilityClient';

export const OBSERVABILITY_WINDOWS = [{ label: '24h', value: 24 }, { label: '7d', value: 24 * 7 }, { label: '30d', value: 24 * 30 }];

export const createMockMetrics = (): MetricsSnapshot => ({ avg_latency_ms: 860, active_runs: 4, failed_runs: 1, throughput_per_hour: 18 });
export const createMockQualitySummary = (): QualitySummary => ({ groundedness_pct: 91, citation_coverage_pct: 84, policy_violation_count: 0 });
export const createMockPromptPairs = (): LlmPromptOutputPair[] => [{ id: 'pair-1', prompt: 'Summarize compliance controls', output: 'Controls summary...', created_at: new Date().toISOString() }];
export const createMockWorkflowBreakdown = (): WorkflowComponentBreakdown[] => [{ component: 'bridge.run', ok_count: 42, error_count: 2 }];
export const getObservabilityScorePct = (s: QualitySummary) => Math.max(0, Math.min(100, Math.round(((s.groundedness_pct + s.citation_coverage_pct) / 2) - s.policy_violation_count * 3)));
export const buildPromptPairsCsv = (items: LlmPromptOutputPair[]) => ['id,prompt,output,created_at', ...items.map((x)=>[x.id,x.prompt,x.output,x.created_at].map((y)=>JSON.stringify(y)).join(','))].join('\n');
