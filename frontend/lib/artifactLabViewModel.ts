import type { BridgeRun, Document } from './mockStore';

export type ArtifactCitation = { id: string; source: string; section: string; note: string; status: 'mapped' | 'missing' };
export type ArtifactDraft = { id: string; kind: 'arc42' | 'risk' | 'sop' | 'audit'; title: string; content: string; citations: ArtifactCitation[] };
export type ArtifactChatMsg = { id: string; role: 'assistant' | 'user'; text: string; at: string };

function ts(v?: string) { const p = Date.parse(v || ''); return Number.isNaN(p) ? 0 : p; }

export function resolveRunLinkedDocuments(run: BridgeRun | undefined, docs: Document[]) {
  const linkedDocuments = docs.filter((d) => (run ? d.product === run.product : true)).sort((a, b) => ts(b.updatedAt) - ts(a.updatedAt));
  return { linkedDocuments, primaryDocument: linkedDocuments[0] };
}

export function buildArtifactRunCards(runs: BridgeRun[], docs: Document[]) {
  return runs.map((run) => {
    const r = resolveRunLinkedDocuments(run, docs);
    return { runId: run.id, product: run.product, status: run.status, startedAt: run.startedAt, evidenceCount: run.evidenceCount || 0, latestDocId: r.primaryDocument?.id || 'n/a', latestDocTitle: r.primaryDocument?.title || 'No linked document' };
  });
}

export function resolveWorkflowDocumentForArtifact(kind: string, linked: Document[], primary?: Document): Document | undefined {
  const k = kind.toLowerCase();
  const m = linked.find((d) => {
    const t = d.type.toLowerCase();
    if (k === 'risk') return t === 'rmf' || t === 'fmea';
    if (k === 'arc42') return t === 'arc42';
    if (k === 'sop') return t === 'sop';
    return false;
  });
  return m || primary;
}

export function computeCitationCoverage(citations: ArtifactCitation[]) {
  const all = citations.length;
  const mapped = citations.filter((c) => c.status === 'mapped').length;
  return { all, mapped, pct: all ? Math.round((mapped / all) * 100) : 100 };
}

export function createAskAuthorAssistantReply(title: string): string {
  return `Proposed refinement for ${title}: tighten controls and add evidence IDs.`;
}

export function applyLatestProposalToDrafts(drafts: ArtifactDraft[], selectedArtifactId: string, stamp: string): ArtifactDraft[] {
  return drafts.map((d) => d.id === selectedArtifactId ? { ...d, content: `${d.content}\n\n## Proposal Applied (${stamp})\n- Added evidence anchors.` } : d);
}

export function buildInitialArtifactDrafts(): ArtifactDraft[] {
  return [
    { id: 'art-arc42', kind: 'arc42', title: 'arc42 Compliance Brief', content: '# arc42 Compliance Brief\n\nDraft narrative.', citations: [{ id: 'c1', source: 'ISO 27001', section: 'A.5', note: 'Policy mapped', status: 'mapped' }] },
    { id: 'art-risk', kind: 'risk', title: 'Risk Summary', content: '# Risk Summary\n\nDraft risk rollup.', citations: [{ id: 'c2', source: 'EU AI Act', section: 'Art. 9', note: 'Update pending', status: 'missing' }] },
    { id: 'art-sop', kind: 'sop', title: 'SOP Traceability Note', content: '# SOP Traceability\n\nDraft SOP notes.', citations: [{ id: 'c3', source: 'SOP-01', section: '3', note: 'Workflow', status: 'mapped' }] },
  ];
}
