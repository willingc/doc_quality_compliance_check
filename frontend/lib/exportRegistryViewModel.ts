import type { ExportJob } from './mockStore';

export const EXPORT_STATUS_OPTIONS = ['All', 'Queued', 'Running', 'Ready', 'Failed'] as const;
export const EXPORT_TYPE_OPTIONS = ['All', 'PDF', 'MD', 'CSV'] as const;

export type ExportStatusFilter = (typeof EXPORT_STATUS_OPTIONS)[number];
export type ExportTypeFilter = (typeof EXPORT_TYPE_OPTIONS)[number];
export type DownloadDestination = 'local' | 'remote' | null;
export type ExportRegistryStats = { total: number; running: number; ready: number; failed: number };

export const filterExports = (items: ExportJob[], status: ExportStatusFilter, type: ExportTypeFilter) => items.filter((i) => (status === 'All' || i.status === status) && (type === 'All' || i.type === type));

export function buildExportRegistryStats(items: ExportJob[]): ExportRegistryStats {
  return { total: items.length, running: items.filter((x)=>x.status==='Running' || x.status==='Queued').length, ready: items.filter((x)=>x.status==='Ready').length, failed: items.filter((x)=>x.status==='Failed').length };
}

export function formatExportTimestamp(value?: string): string {
  if (!value) return 'n/a';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export function formatExportDuration(startedAt?: string, endedAt?: string): string {
  if (!startedAt || !endedAt) return 'n/a';
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 'n/a';
  return `${Math.round((end - start) / 1000)}s`;
}

export function getExportStatusBadgeClass(status: ExportJob['status']): string {
  switch (status) {
    case 'Ready': return 'bg-emerald-100 text-emerald-700';
    case 'Running':
    case 'Queued': return 'bg-blue-100 text-blue-700';
    case 'Failed': return 'bg-rose-100 text-rose-700';
    default: return 'bg-neutral-100 text-neutral-700';
  }
}

export function getExportStatusDotClass(status: ExportJob['status']): string {
  switch (status) {
    case 'Ready': return 'bg-emerald-500';
    case 'Running':
    case 'Queued': return 'bg-blue-500';
    case 'Failed': return 'bg-rose-500';
    default: return 'bg-neutral-400';
  }
}

export const getSourceStatusBadgeClass = (isDemo = false) => (isDemo ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700');
export const buildExportFilename = (job: ExportJob, destination: DownloadDestination) => `${job.docId}-${job.type.toLowerCase()}-${destination === 'remote' ? 'remote' : 'local'}`;
