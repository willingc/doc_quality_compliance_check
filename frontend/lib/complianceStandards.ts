export type ComplianceShortcut = { id: string; label: string; href: string };
export type ComplianceStandard = { id: string; code: string; title: string; category: string; status: 'covered' | 'partial' | 'missing' };
export type ComplianceAlert = { id: string; title: string; severity: 'low' | 'medium' | 'high'; createdAt: string };
export type ComplianceAlertsInfo = { total: number; high: number };

export const toneClasses = { covered: 'bg-emerald-100 text-emerald-700', partial: 'bg-amber-100 text-amber-700', missing: 'bg-rose-100 text-rose-700', low: 'bg-blue-100 text-blue-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-rose-100 text-rose-700' };
export const categoryMetadata: Record<string, { title: string }> = { quality: { title: 'Quality' }, security: { title: 'Security' }, ai: { title: 'AI Regulation' } };
export const complianceShortcuts: ComplianceShortcut[] = [{ id: 'req-map', label: 'Request Mapping', href: '/compliance/request-standard-mapping' }, { id: 'alerts', label: 'Alert Archive', href: '/alert-archive' }];
export const complianceAlerts: ComplianceAlert[] = [{ id: 'AL-1', title: 'Control owner missing', severity: 'medium', createdAt: new Date().toISOString() }];
export const complianceAlertArchive: ComplianceAlert[] = complianceAlerts;
export const complianceAlertsInfo: ComplianceAlertsInfo = { total: complianceAlerts.length, high: complianceAlerts.filter((x)=>x.severity==='high').length };

const standards: ComplianceStandard[] = [
  { id: 'std-iso-9001-1', code: 'ISO 9001 8.5', title: 'Production and service provision', category: 'quality', status: 'covered' },
  { id: 'std-iso-27001-1', code: 'ISO 27001 A.5', title: 'Policies for information security', category: 'security', status: 'partial' },
  { id: 'std-eu-ai-1', code: 'EU AI Act Art. 9', title: 'Risk management system', category: 'ai', status: 'missing' },
];

export function getGroupedStandards(): Record<string, ComplianceStandard[]> { return standards.reduce<Record<string, ComplianceStandard[]>>((a,s)=>{ if(!a[s.category]) a[s.category]=[]; a[s.category].push(s); return a; },{}); }
