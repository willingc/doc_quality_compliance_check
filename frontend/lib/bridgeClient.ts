export type BridgeRunResponse = {
  run_id: string;
  compliance_score?: number;
  human_review_required?: boolean;
  automatic_recommendation?: 'approved' | 'rejected';
  regulatory_update?: { requires_document_update: boolean; message?: string };
};

export type BridgeHumanReviewResponse = {
  run_id?: string;
  document_id?: string;
  decision: 'approved' | 'rejected';
  reason: string;
  reviewer_email: string;
  reviewed_at: string;
  next_task_type?: 'rerun_bridge' | 'manual_follow_up';
  next_task_assignee?: string;
  next_task_instructions?: string;
};

function apiPath(path: string): string {
  const origin = process.env.NEXT_PUBLIC_API_ORIGIN?.trim();
  return origin ? `${origin.replace(/\/$/, '')}${path}` : path;
}

async function request<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiPath(path), { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload?.message || `Bridge request failed (${res.status})`);
  return payload as T;
}

export function executeBridgeEuAiActRun(documentId: string, domainInfo: any): Promise<BridgeRunResponse> {
  return request('/api/v1/bridge/eu-ai-act/run', { method: 'POST', body: JSON.stringify({ document_id: documentId, domain_info: domainInfo }) });
}

export async function fetchBridgeEuAiActAlert(documentId: string): Promise<{ regulatory_update: { requires_document_update: boolean; message?: string } }> {
  try { return await request(`/api/v1/bridge/eu-ai-act/alert?document_id=${encodeURIComponent(documentId)}`, { method: 'GET' }); }
  catch { return { regulatory_update: { requires_document_update: false } }; }
}

export function fetchBridgeHumanReview(runId: string): Promise<BridgeHumanReviewResponse> {
  return request(`/api/v1/bridge/${encodeURIComponent(runId)}/human-review`, { method: 'GET' });
}

export function submitBridgeHumanReview(runId: string, body: any): Promise<BridgeHumanReviewResponse> {
  return request(`/api/v1/bridge/${encodeURIComponent(runId)}/human-review`, { method: 'POST', body: JSON.stringify(body) });
}

export async function reloadBridgeAgents(): Promise<{ ok: boolean; message: string }> {
  try {
    const payload = await request<{message?:string}>('/api/v1/bridge/reload', { method: 'POST' });
    return { ok: true, message: payload.message || 'Agents reloaded' };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Reload failed' };
  }
}
