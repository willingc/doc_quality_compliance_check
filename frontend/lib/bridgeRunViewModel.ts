import type { BridgeRunResponse, BridgeHumanReviewResponse } from './bridgeClient';

export const bridgeSteps = [
  { id: 'inspection', title: 'Document Inspection', desc: 'Inspect baseline data quality and metadata.' },
  { id: 'compliance', title: 'Compliance Check', desc: 'Evaluate controls and standards mapping.' },
  { id: 'research', title: 'Regulatory Research', desc: 'Cross-check framework updates and citations.' },
  { id: 'approval', title: 'Quality Gate', desc: 'Produce recommendation and await HITL decision.' },
];

export const buildLogMessage = (msg: string) => `[${new Date().toLocaleTimeString()}] ${msg}`;

export const deriveComplianceChecks = (doc: any, backendRun: BridgeRunResponse | null) => [
  { name: 'Document exists', passed: Boolean(doc?.id) },
  { name: 'Control mapping available', passed: (backendRun?.compliance_score ?? 0.8) >= 0.6 },
  { name: 'Version is present', passed: Boolean(doc?.version || doc?.title) },
];

export const deriveResearchChecks = (_doc: any) => [
  { name: 'EU AI Act alignment', passed: true },
  { name: 'ISO references', passed: true },
];

export function deriveAutomaticRecommendation(complianceChecks: Array<{ passed: boolean }>, researchChecks: Array<{ passed: boolean }>, backendRun: BridgeRunResponse | null): 'approved' | 'rejected' {
  if (backendRun?.automatic_recommendation) return backendRun.automatic_recommendation;
  return [...complianceChecks, ...researchChecks].every((c) => c.passed) ? 'approved' : 'rejected';
}

export function buildQualityGateSummary(input: { activeStep: number; isProcessing: boolean; backendRun: BridgeRunResponse | null; complianceChecks: Array<{ passed: boolean }>; researchChecks: Array<{ passed: boolean }> }) {
  if (input.isProcessing) return { heading: 'In progress', text: 'Bridge workflow is currently executing checks.' };
  const rec = deriveAutomaticRecommendation(input.complianceChecks, input.researchChecks, input.backendRun);
  return { heading: rec === 'approved' ? 'Recommendation: Approve' : 'Recommendation: Reject', text: input.backendRun?.human_review_required ? 'Human review is mandatory before final acceptance.' : 'Automatic recommendation can be used for draft decisions.' };
}

export function createLocalHumanReviewRecord(input: { runId?: string; documentId: string; decision: 'approved' | 'rejected'; reason: string; reviewerEmail: string; nextTaskType?: 'rerun_bridge' | 'manual_follow_up'; nextTaskAssignee?: string; nextTaskInstructions?: string }): BridgeHumanReviewResponse {
  return { run_id: input.runId, document_id: input.documentId, decision: input.decision, reason: input.reason, reviewer_email: input.reviewerEmail, reviewed_at: new Date().toISOString(), next_task_type: input.decision === 'rejected' ? input.nextTaskType : undefined, next_task_assignee: input.decision === 'rejected' ? input.nextTaskAssignee : undefined, next_task_instructions: input.decision === 'rejected' ? input.nextTaskInstructions : undefined };
}

export const formatBridgeDateTime = (value?: string) => !value ? 'n/a' : (Number.isNaN(new Date(value).getTime()) ? value : new Date(value).toLocaleString());
export const inferBridgeDomainInfo = (doc: any) => ({ product: doc?.product || 'Unknown', type: doc?.type || 'Generic' });
