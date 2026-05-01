import type { AuditTrailEvent } from './auditTrailClient';

export const AUDIT_WINDOWS = [{ label: '24h', value: 24 }, { label: '7d', value: 24 * 7 }, { label: '30d', value: 24 * 30 }];
export type AuditTrailKpis = { total: number; bridgeEvents: number; reviewEvents: number };
export type NearestFutureAudit = { at: string; inDays: number } | null;

export const createMockAuditTrailEvents = (): AuditTrailEvent[] => [{ event_id: 'EVT-1', run_id: 'RUN-201', document_id: 'DOC-001', event_type: 'bridge.run.recommendation', actor_email: 'system', action_date: new Date().toISOString(), payload: { recommendation: 'approved' } }];
export const getEffectiveAuditEvents = (events: AuditTrailEvent[], useMock = false) => events.length ? events : (useMock ? createMockAuditTrailEvents() : []);
export const buildAuditKpis = (events: AuditTrailEvent[]): AuditTrailKpis => ({ total: events.length, bridgeEvents: events.filter((e)=>e.event_type.includes('bridge')).length, reviewEvents: events.filter((e)=>e.event_type.includes('review')).length });
export const formatTs = (v?: string) => !v ? 'n/a' : (Number.isNaN(new Date(v).getTime()) ? v : new Date(v).toLocaleString());
export const formatDateInputValue = (v?: string) => !v ? '' : v.slice(0,10);
export const toInputDateOrEmpty = formatDateInputValue;
export const toApiDateTimeOrNull = (v: string) => !v ? null : (Number.isNaN(Date.parse(v)) ? null : new Date(Date.parse(v)).toISOString());
export function getNearestFutureAudit(nextAuditAt?: string): NearestFutureAudit { if (!nextAuditAt) return null; const t = new Date(nextAuditAt).getTime(); if (!Number.isFinite(t)) return null; const d = t - Date.now(); if (d < 0) return null; return { at: nextAuditAt, inDays: Math.ceil(d/(1000*60*60*24)) }; }
export const getAuditMarker = (type: string) => type.includes('approve') ? 'APP' : type.includes('reject') ? 'REJ' : type.includes('bridge') ? 'BRG' : 'EVT';
export const getAuditRowHighlightClass = (type: string) => type.includes('reject') ? 'bg-rose-50' : type.includes('approve') ? 'bg-emerald-50' : 'bg-white';
export const deriveEventDetailLines = (event?: AuditTrailEvent | null) => !event ? [] : [`Event ID: ${event.event_id}`, `Type: ${event.event_type}`, `Actor: ${event.actor_email}`, `Timestamp: ${formatTs(event.action_date)}`];
