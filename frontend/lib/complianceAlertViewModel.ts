import type { ComplianceAlert } from './complianceStandards';

export type ComplianceAlertSeverity = 'All' | 'low' | 'medium' | 'high';
export type ComplianceAlertFilters = { severity: ComplianceAlertSeverity; from?: string; to?: string };

export function normalizeDateRange(from?: string, to?: string): { from?: string; to?: string } {
  if (!from && !to) return {};
  return { from: from ? new Date(from).toISOString() : undefined, to: to ? new Date(to).toISOString() : undefined };
}

export function filterComplianceAlerts(items: ComplianceAlert[], filters: ComplianceAlertFilters): ComplianceAlert[] {
  const range = normalizeDateRange(filters.from, filters.to);
  return items.filter((item) => {
    if (filters.severity !== 'All' && item.severity !== filters.severity) return false;
    const t = Date.parse(item.createdAt);
    if (range.from && t < Date.parse(range.from)) return false;
    if (range.to && t > Date.parse(range.to)) return false;
    return true;
  });
}
