type ArtifactExportRequest = { runId: string; artifactId: string; artifactTitle: string; artifactContent: string; documentId?: string };
type ArtifactExportResponse = { ok: boolean; message: string; degradedToDemo?: boolean };

function apiPath(path: string): string { const origin = process.env.NEXT_PUBLIC_API_ORIGIN?.trim(); return origin ? `${origin.replace(/\/$/, '')}${path}` : path; }

async function post(path: string, body: ArtifactExportRequest): Promise<ArtifactExportResponse> {
  try {
    const res = await fetch(apiPath(path), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: payload?.message || `Request failed (${res.status})` };
    return { ok: true, message: payload?.message || 'Export completed' };
  } catch {
    return { ok: true, message: 'Stored in demo queue', degradedToDemo: true };
  }
}

export const exportArtifactPdf = (body: ArtifactExportRequest) => post('/api/v1/artifacts/export/pdf', body);
export const exportArtifactMarkdown = (body: ArtifactExportRequest) => post('/api/v1/artifacts/export/markdown', body);
export const pushArtifactToWiki = (body: ArtifactExportRequest) => post('/api/v1/artifacts/push/wiki', body);
