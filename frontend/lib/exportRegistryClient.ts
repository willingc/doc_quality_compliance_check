import type { ExportJob } from './mockStore';

export async function downloadExportToBrowser(job: ExportJob): Promise<void> {
  const filename = `${job.docId}-${job.type.toLowerCase()}.txt`;
  const blob = new Blob([`Export placeholder for ${job.id}`], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function uploadExportToRemote(input: { exportJob: ExportJob; remoteServerUrl: string }): Promise<{ ok: boolean }> {
  const url = input.remoteServerUrl.trim();
  if (!url) throw new Error('Remote server URL is required.');
  const response = await fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ export_id: input.exportJob.id, document_id: input.exportJob.docId, type: input.exportJob.type }) });
  if (!response.ok) throw new Error(`Remote upload failed (${response.status})`);
  return { ok: true };
}
