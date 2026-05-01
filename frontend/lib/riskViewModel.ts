import type { Document } from './mockStore';

export type RiskTypeFilter = 'All' | 'RMF' | 'FMEA';
export type RiskStatusFilter = 'All' | 'Draft' | 'In Review' | 'Approved' | 'rework after review';

export type RiskRecordRow = {
  id: string;
  title: string;
  type: 'RMF' | 'FMEA';
  product: string;
  status: Document['status'];
  version: string;
  updatedAt: string;
  updatedBy: string;
  hazardCount: number;
  mitigationCount: number;
  residualRisk: 'Low' | 'Medium' | 'High';
  mutable: boolean;
};

function count(content: string, words: string[]) {
  const lower = (content || '').toLowerCase();
  return words.reduce((a, w) => a + (lower.includes(w) ? 1 : 0), 0);
}

export function buildRiskRows(docs: Document[]): RiskRecordRow[] {
  return docs.filter((d) => d.type === 'RMF' || d.type === 'FMEA').map((d) => ({
    id: d.id, title: d.title, type: d.type as 'RMF' | 'FMEA', product: d.product, status: d.status, version: d.version, updatedAt: d.updatedAt, updatedBy: d.updatedBy,
    hazardCount: count(d.content, ['hazard', 'failure', 'risk']) || 1, mitigationCount: count(d.content, ['mitigation', 'control']) || 1,
    residualRisk: d.status === 'Approved' ? 'Low' : d.status === 'In Review' ? 'Medium' : 'High', mutable: d.status !== 'Approved',
  })).sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt));
}

export function buildSeededRiskRows(docs: Document[]): RiskRecordRow[] { return buildRiskRows(docs); }

export function filterRiskRows(rows: RiskRecordRow[], query: string, typeFilter: RiskTypeFilter, statusFilter: RiskStatusFilter, productFilter: string): RiskRecordRow[] {
  const q = query.trim().toLowerCase();
  const p = productFilter.trim().toLowerCase();
  return rows.filter((r) => {
    if (typeFilter !== 'All' && r.type !== typeFilter) return false;
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    if (productFilter !== 'All' && p && r.product.toLowerCase() !== p) return false;
    if (!q) return true;
    return `${r.id} ${r.title} ${r.product}`.toLowerCase().includes(q);
  });
}

export function buildRiskStats(rows: RiskRecordRow[]) {
  const reworkAfterReview = rows.filter((r)=>r.status==='rework after review').length;
  return { total: rows.length, drafts: rows.filter((r)=>r.status==='Draft' || r.status==='rework after review').length, inReview: rows.filter((r)=>r.status==='In Review').length, approved: rows.filter((r)=>r.status==='Approved').length, reworkAfterReview };
}

export function formatRiskDate(value?: string): string {
  if (!value) return 'n/a';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export function buildRiskDocId(type: 'RMF' | 'FMEA'): string {
  return `${type === 'RMF' ? 'DOC-RMF' : 'DOC-FMEA'}-${Date.now().toString().slice(-6)}`;
}
