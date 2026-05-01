export type DashboardTimeframe = 'week' | 'month' | 'quarter';
export type DashboardSummary = {
  totals: { documents: number; approved: number; inReview: number; drafts: number; passRatePct: number };
  risk: { high: number; medium: number; low: number };
  standards: Array<{ standard: string; covered: number; total: number }>;
};

function apiPath(path: string): string {
  const origin = process.env.NEXT_PUBLIC_API_ORIGIN?.trim();
  return origin ? `${origin.replace(/\/$/, '')}${path}` : path;
}

export async function fetchDashboardSummary(timeframe: DashboardTimeframe): Promise<DashboardSummary> {
  const res = await fetch(apiPath(`/api/v1/dashboard/summary?timeframe=${encodeURIComponent(timeframe)}`), { method: 'GET', credentials: 'include' });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload?.message || 'Dashboard request failed');
  return payload as DashboardSummary;
}
