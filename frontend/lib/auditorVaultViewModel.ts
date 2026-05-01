import type { BridgeRun, Document, ExportJob } from './mockStore';

export function buildVaultSnapshot(documents: Document[], exports: ExportJob[], bridgeRuns: BridgeRun[]) {
  return { documentCount: documents.length, exportCount: exports.length, bridgeRunCount: bridgeRuns.length, readinessScore: Math.max(0, Math.min(100, Math.round((documents.filter((d)=>d.status==='Approved').length / Math.max(1, documents.length)) * 100))) };
}

export function buildVaultEvidenceRows(documents: Document[], exports: ExportJob[], bridgeRuns: BridgeRun[]) {
  return [
    ...documents.map((d) => ({ id: d.id, source: 'Document', title: d.title, status: d.status, updatedAt: d.updatedAt })),
    ...exports.map((e) => ({ id: e.id, source: 'Export', title: `${e.docId} (${e.type})`, status: e.status, updatedAt: e.completedAt || e.createdAt })),
    ...bridgeRuns.map((r) => ({ id: r.id, source: 'Bridge Run', title: r.product, status: r.status, updatedAt: r.startedAt })),
  ];
}

export const getHealthBadgeClass = (score: number) => score >= 80 ? 'bg-emerald-100 text-emerald-700' : score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';
