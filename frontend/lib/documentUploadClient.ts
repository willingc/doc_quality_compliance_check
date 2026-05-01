import type { Document } from './mockStore';

const ACCEPTED = ['md', 'txt', 'pdf', 'docx'];
export const ACCEPTED_UPLOAD_TYPES_LABEL = ACCEPTED.map((x) => `.${x}`).join(', ');

const ext = (name: string) => { const p = name.toLowerCase().split('.'); return p.length > 1 ? p[p.length - 1] : ''; };

export function validateUploadFileType(file: File): { ok: boolean; extension?: string } {
  const e = ext(file.name);
  if (!e || !ACCEPTED.includes(e)) return { ok: false, extension: e };
  return { ok: true, extension: e };
}

export async function uploadDocument(file: File, actorEmail: string): Promise<{ ok: boolean; document?: Document; message: string; degradedToDemo?: boolean }> {
  const v = validateUploadFileType(file);
  if (!v.ok) return { ok: false, message: `Unsupported file type .${v.extension || 'unknown'}` };

  return {
    ok: true,
    degradedToDemo: true,
    message: 'Upload simulated locally',
    document: {
      id: `DOC-${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, ''),
      type: (v.extension || 'Generic').toUpperCase(),
      product: 'AI-Diagnostics-Core',
      status: 'Draft',
      version: '0.1.0',
      updatedAt: new Date().toISOString(),
      updatedBy: actorEmail,
      content: '',
    },
  };
}
