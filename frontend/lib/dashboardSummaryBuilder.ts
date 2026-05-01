import type { BridgeRun, Document, ExportJob } from './mockStore';
import type { DashboardSummary, DashboardTimeframe } from './dashboardClient';

export function buildMockDashboardSummary(documents: Document[], exports: ExportJob[], bridgeRuns: BridgeRun[], _timeframe: DashboardTimeframe): DashboardSummary {
  const approved = documents.filter((d)=>d.status==='Approved').length;
  const inReview = documents.filter((d)=>d.status==='In Review').length;
  const drafts = documents.length - approved - inReview;
  const passSignals = bridgeRuns.filter((r)=>r.status==='Done').length + exports.filter((e)=>e.status==='Ready').length;
  const totalSignals = Math.max(1, bridgeRuns.length + exports.length);
  return {
    totals: { documents: documents.length, approved, inReview, drafts, passRatePct: Math.round((passSignals/totalSignals)*100) },
    risk: { high: documents.filter((d)=>/risk|fmea|rmf/i.test(d.type) && d.status!=='Approved').length, medium: Math.max(1,Math.floor(documents.length/3)), low: Math.max(1,Math.floor(documents.length/2)) },
    standards: [
      { standard: 'ISO 9001', covered: Math.max(1, approved), total: Math.max(3, documents.length) },
      { standard: 'ISO 27001', covered: Math.max(1, approved-1), total: Math.max(3, documents.length) },
      { standard: 'EU AI Act', covered: Math.max(1, approved-2), total: Math.max(3, documents.length) },
    ],
  };
}

export function getRiskTotal(summary: DashboardSummary): number {
  return summary.risk.high + summary.risk.medium + summary.risk.low;
}
