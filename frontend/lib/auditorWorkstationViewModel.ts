import type { AuditTrailEvent } from './auditTrailClient';
import type { BridgeHumanReviewResponse } from './bridgeClient';

export const AUDITOR_WINDOWS = [{ label: '30d', value: 24 * 30 }, { label: '7d', value: 24 * 7 }, { label: '24h', value: 24 }];

export type DecisionDraft = { decision: 'approved' | 'rejected'; reason: string; nextTaskType: 'rerun_bridge' | 'manual_follow_up'; nextTaskAssignee: string; nextTaskInstructions: string };
export type CandidateWithReview = { runId: string; documentId: string; recommendation: 'approved' | 'rejected'; score: number; event: AuditTrailEvent; review?: BridgeHumanReviewResponse };
export type AuditorFollowUpTask = { runId: string; assignee: string; instructions: string };
export type AuditorQueueKpis = { pending: number; reviewed: number; rejectionRatePct: number };

export const formatTs = (v?: string) => !v ? 'n/a' : (Number.isNaN(new Date(v).getTime()) ? v : new Date(v).toLocaleString());

export const createMockAuditorEvents = (): AuditTrailEvent[] => [{ event_id: 'EVT-AUD-1', run_id: 'RUN-201', document_id: 'DOC-001', event_type: 'bridge.run.recommendation', actor_email: 'system', action_date: new Date().toISOString(), payload: { recommendation: 'approved', compliance_score: 0.91 } }];

export function buildCandidates(events: AuditTrailEvent[], reviewsByRunId: Record<string, BridgeHumanReviewResponse>): CandidateWithReview[] {
  return events.filter((e)=>e.event_type.includes('bridge')).map((e)=>{ const runId = e.run_id || e.event_id; return { runId, documentId: e.document_id || 'unknown', recommendation: e.payload?.recommendation === 'rejected' ? 'rejected' : 'approved', score: Number(e.payload?.compliance_score ?? 0.75), event: e, review: reviewsByRunId[runId] }; });
}

export const buildAuditorQueueKpis = (pending: CandidateWithReview[], reviewed: CandidateWithReview[]): AuditorQueueKpis => ({ pending: pending.length, reviewed: reviewed.length, rejectionRatePct: reviewed.length ? Math.round((reviewed.filter((r)=>r.review?.decision==='rejected').length/reviewed.length)*100) : 0 });
export const getSelectedCandidate = (all: CandidateWithReview[], pending: CandidateWithReview[], reviewed: CandidateWithReview[], selectedRunId: string | null): CandidateWithReview | null => !all.length ? null : (selectedRunId ? all.find((c)=>c.runId===selectedRunId) || null : pending[0] || reviewed[0] || all[0]);
export const getSelectedDisplayScore = (selected: CandidateWithReview | null): number | null => selected ? Math.round(selected.score * 100) : null;
export const buildOpenFollowUps = (reviewed: CandidateWithReview[]): AuditorFollowUpTask[] => reviewed.filter((r)=>r.review?.decision==='rejected').map((r)=>({ runId: r.runId, assignee: r.review?.next_task_assignee || 'unassigned', instructions: r.review?.next_task_instructions || 'No instructions.' }));
export const createInitialDecisionDraft = (): DecisionDraft => ({ decision: 'approved', reason: '', nextTaskType: 'rerun_bridge', nextTaskAssignee: '', nextTaskInstructions: '' });
export const createLocalBridgeReview = (input: { runId: string; documentId: string; decision: 'approved' | 'rejected'; reason: string; reviewerEmail: string; reviewerRoles?: string[]; nextTaskType?: 'rerun_bridge' | 'manual_follow_up'; nextTaskAssignee?: string; nextTaskInstructions?: string }): BridgeHumanReviewResponse => ({ run_id: input.runId, document_id: input.documentId, decision: input.decision, reason: input.reason, reviewer_email: input.reviewerEmail, reviewed_at: new Date().toISOString(), next_task_type: input.decision === 'rejected' ? input.nextTaskType : undefined, next_task_assignee: input.decision === 'rejected' ? input.nextTaskAssignee : undefined, next_task_instructions: input.decision === 'rejected' ? input.nextTaskInstructions : undefined });
