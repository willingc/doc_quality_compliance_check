export type AuditTrailEvent = { event_id: string; run_id?: string; document_id?: string; event_type: string; actor_email: string; action_date: string; payload?: Record<string, any> };

export async function fetchAuditTrailEvents(_params: { windowHours?: number; limit?: number; eventType?: string } = {}): Promise<{ items: AuditTrailEvent[] }> { return { items: [] }; }
export async function fetchAuditTrailEventDetail(_eventId: string): Promise<AuditTrailEvent | null> { return null; }
export async function fetchAuditTrailSchedule(): Promise<{ next_audit_at?: string; notes?: string }> { return {}; }
export async function upsertAuditTrailSchedule(payload: { next_audit_at?: string; notes?: string }): Promise<{ next_audit_at?: string; notes?: string }> { return payload; }
