import { create } from 'zustand';

export type DocumentStatus = 'Draft' | 'In Review' | 'Approved' | 'rework after review';
export type Document = {
  id: string;
  title: string;
  type: string;
  product: string;
  status: DocumentStatus;
  version: string;
  lockedBy?: string;
  updatedAt: string;
  updatedBy: string;
  content: string;
};

export type ExportJob = {
  id: string;
  docId: string;
  type: 'PDF' | 'MD' | 'CSV';
  status: 'Queued' | 'Running' | 'Ready' | 'Failed';
  createdAt: string;
  completedAt?: string;
  url?: string;
};

export type BridgeRun = {
  id: string;
  product: string;
  status: 'Idle' | 'Running' | 'Done' | 'Error';
  startedAt: string;
  verdict?: string;
  classificationWhy?: string;
  evidenceCount?: number;
};

type Store = {
  currentUserId: string;
  documents: Document[];
  exports: ExportJob[];
  bridgeRuns: BridgeRun[];
  isOperationsRunning: boolean;
  getDocById: (id: string) => Document | undefined;
  addDocument: (doc: Document) => void;
  updateDocStatus: (docId: string, status: DocumentStatus) => void;
  enqueueExport: (docId: string, type?: ExportJob['type']) => ExportJob;
  removeExportJob: (jobId: string) => void;
  removeBridgeRun: (runId: string) => void;
  clearCompletedOperations: () => void;
  acquireLock: (docId: string) => { success: boolean; holder?: string };
  releaseLock: (docId: string) => void;
  setDocumentLock: (docId: string, holder?: string) => void;
};

const nowIso = () => new Date().toISOString();

const deriveRunning = (exportsList: ExportJob[], runs: BridgeRun[]) =>
  exportsList.some((j) => j.status === 'Running' || j.status === 'Queued') || runs.some((r) => r.status === 'Running');

export const useMockStore = create<Store>((set, get) => ({
  currentUserId: 'mvp-user@example.invalid',
  documents: [
    { id: 'DOC-001', title: 'Quality Manual', type: 'SOP', product: 'AI-Diagnostics-Core', status: 'Approved', version: '1.0.0', updatedAt: '2026-04-05T12:00:00.000Z', updatedBy: 'maria@example.invalid', content: '# Quality Manual' },
    { id: 'DOC-003', title: 'Neural Engine Architecture', type: 'arc42', product: 'AI-Diagnostics-Core', status: 'Draft', version: '1.1.0', updatedAt: '2026-04-06T09:00:00.000Z', updatedBy: 'jan@example.invalid', content: '# arc42' },
    { id: 'DOC-RISK-002', title: 'FMEA Gateway', type: 'FMEA', product: 'AI-Diagnostics-Core', status: 'rework after review', version: '0.2.0', updatedAt: '2026-04-04T12:00:00.000Z', updatedBy: 'sven@example.invalid', content: 'risk hazard failure mitigation control' },
  ],
  exports: [
    { id: 'EXP-1001', docId: 'DOC-001', type: 'PDF', status: 'Ready', createdAt: '2026-04-05T12:15:00.000Z', completedAt: '2026-04-05T12:17:00.000Z', url: '/downloads/DOC-001.pdf' },
    { id: 'EXP-1002', docId: 'DOC-003', type: 'MD', status: 'Running', createdAt: nowIso() },
  ],
  bridgeRuns: [
    { id: 'RUN-201', product: 'AI-Diagnostics-Core', status: 'Done', startedAt: '2026-03-15 10:00', verdict: 'High', classificationWhy: 'Automated checks complete', evidenceCount: 15 },
    { id: 'RUN-202', product: 'AI-Diagnostics-Core', status: 'Running', startedAt: nowIso(), evidenceCount: 4 },
  ],
  isOperationsRunning: true,

  getDocById: (id) => get().documents.find((d) => d.id === id),
  addDocument: (doc) => set((s) => (s.documents.some((d) => d.id === doc.id) ? s : { documents: [doc, ...s.documents] })),
  updateDocStatus: (docId, status) => set((s) => ({ documents: s.documents.map((d) => (d.id === docId ? { ...d, status, updatedAt: nowIso() } : d)) })),

  enqueueExport: (docId, type = 'PDF') => {
    const job: ExportJob = { id: `EXP-${Date.now()}`, docId, type, status: 'Queued', createdAt: nowIso() };
    set((s) => {
      const exportsList = [job, ...s.exports];
      return { exports: exportsList, isOperationsRunning: deriveRunning(exportsList, s.bridgeRuns) };
    });
    return job;
  },

  removeExportJob: (jobId) => set((s) => {
    const exportsList = s.exports.filter((j) => j.id !== jobId);
    return { exports: exportsList, isOperationsRunning: deriveRunning(exportsList, s.bridgeRuns) };
  }),

  removeBridgeRun: (runId) => set((s) => {
    const runs = s.bridgeRuns.filter((r) => r.id !== runId);
    return { bridgeRuns: runs, isOperationsRunning: deriveRunning(s.exports, runs) };
  }),

  clearCompletedOperations: () => set((s) => {
    const exportsList = s.exports.filter((j) => j.status === 'Running' || j.status === 'Queued');
    const runs = s.bridgeRuns.filter((r) => r.status === 'Running' || r.status === 'Idle');
    return { exports: exportsList, bridgeRuns: runs, isOperationsRunning: deriveRunning(exportsList, runs) };
  }),

  acquireLock: (docId) => {
    const doc = get().documents.find((d) => d.id === docId);
    if (!doc) return { success: false };
    if (doc.lockedBy && doc.lockedBy !== get().currentUserId) return { success: false, holder: doc.lockedBy };
    set((s) => ({ documents: s.documents.map((d) => (d.id === docId ? { ...d, lockedBy: s.currentUserId } : d)) }));
    return { success: true };
  },

  releaseLock: (docId) => set((s) => ({ documents: s.documents.map((d) => (d.id === docId && d.lockedBy === s.currentUserId ? { ...d, lockedBy: undefined } : d)) })),
  setDocumentLock: (docId, holder) => set((s) => ({ documents: s.documents.map((d) => (d.id === docId ? { ...d, lockedBy: holder } : d)) })),
}));

useMockStore.setState((s) => ({ ...s, isOperationsRunning: deriveRunning(s.exports, s.bridgeRuns) }));
