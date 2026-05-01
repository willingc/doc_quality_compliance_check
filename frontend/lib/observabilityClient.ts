export type MetricsSnapshot = { avg_latency_ms: number; active_runs: number; failed_runs: number; throughput_per_hour: number };
export type QualitySummary = { groundedness_pct: number; citation_coverage_pct: number; policy_violation_count: number };
export type LlmPromptOutputPair = { id: string; prompt: string; output: string; created_at: string };
export type WorkflowComponentBreakdown = { component: string; ok_count: number; error_count: number };

export const fetchMetricsSnapshot = async (): Promise<MetricsSnapshot> => ({ avg_latency_ms: 0, active_runs: 0, failed_runs: 0, throughput_per_hour: 0 });
export const fetchQualitySummary = async (): Promise<QualitySummary> => ({ groundedness_pct: 0, citation_coverage_pct: 0, policy_violation_count: 0 });
export const fetchLlmPromptOutputPairs = async (): Promise<LlmPromptOutputPair[]> => [];
export const fetchWorkflowComponentBreakdown = async (): Promise<WorkflowComponentBreakdown[]> => [];
