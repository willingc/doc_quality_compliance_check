import type { Document } from './mockStore';

export type DocumentRetrievalResult = {
  ok: boolean;
  documents: Document[];
  degradedToDemo?: boolean;
  message?: string;
};

function mapRow(row: any): Document {
  return {
    id: row.document_id || row.id,
    title: row.title || row.filename || row.document_id || 'Untitled',
    type: row.document_type || row.type || 'Generic',
    product: row.product || 'Unknown Product',
    status: row.status || 'Draft',
    version: row.version || '0.1.0',
    lockedBy: row.locked_by || undefined,
    updatedAt: row.updated_at || new Date().toISOString(),
    updatedBy: row.updated_by || 'system',
    content: row.extracted_text || row.content || '',
  };
}

function apiPath(path: string): string {
  const origin = process.env.NEXT_PUBLIC_API_ORIGIN?.trim();
  return origin ? `${origin.replace(/\/$/, '')}${path}` : path;
}

export async function listDocuments(): Promise<DocumentRetrievalResult> {
  try {
    const response = await fetch(apiPath('/api/v1/documents'), { method: 'GET', credentials: 'include' });
    if (!response.ok) return { ok: false, documents: [], message: `Failed with status ${response.status}` };
    const payload = await response.json();
    const rows = Array.isArray(payload?.documents) ? payload.documents : [];
    return { ok: true, documents: rows.map(mapRow) };
  } catch {
    return { ok: true, degradedToDemo: true, documents: [], message: 'Backend unavailable, using demo mode.' };
  }
}
