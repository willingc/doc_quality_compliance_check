import type { ParsedUrlQuery } from 'querystring';
import type { Document } from './mockStore';

export const DOCUMENT_STATUS_FILTERS = ['All', 'Draft', 'In Review', 'Approved', 'rework after review'] as const;
export type DocumentStatusFilter = (typeof DOCUMENT_STATUS_FILTERS)[number];

function isStatusFilter(value: string): value is DocumentStatusFilter {
  return (DOCUMENT_STATUS_FILTERS as readonly string[]).includes(value);
}

export function getDocumentHubFilters(query: ParsedUrlQuery | Record<string, any>) {
  const queryFilter = typeof query.q === 'string' ? query.q : '';
  const projectFilter = typeof query.project === 'string' ? query.project : '';
  const rawStatus = typeof query.status === 'string' ? query.status : 'All';
  const statusFilter: DocumentStatusFilter = isStatusFilter(rawStatus) ? rawStatus : 'All';
  return { queryFilter, projectFilter, statusFilter };
}

export function buildDocumentHubQuery(queryFilter: string, projectFilter: string, statusFilter: DocumentStatusFilter): Record<string, string> {
  const out: Record<string, string> = {};
  if (queryFilter.trim()) out.q = queryFilter.trim();
  if (projectFilter.trim()) out.project = projectFilter.trim();
  if (statusFilter !== 'All') out.status = statusFilter;
  return out;
}

export function filterDocuments(docs: Document[], queryFilter: string, projectFilter: string, statusFilter: DocumentStatusFilter): Document[] {
  const q = queryFilter.trim().toLowerCase();
  const p = projectFilter.trim().toLowerCase();
  return docs
    .filter((d) => (statusFilter === 'All' ? true : d.status === statusFilter))
    .filter((d) => (!p ? true : d.product.toLowerCase() === p))
    .filter((d) => (!q ? true : `${d.id} ${d.title} ${d.type} ${d.product}`.toLowerCase().includes(q)));
}

export function getDocumentStatusBadgeClass(status: Document['status']): string {
  switch (status) {
    case 'Approved': return 'bg-emerald-100 text-emerald-700';
    case 'In Review': return 'bg-blue-100 text-blue-700';
    case 'rework after review': return 'bg-amber-100 text-amber-700';
    default: return 'bg-neutral-100 text-neutral-700';
  }
}
