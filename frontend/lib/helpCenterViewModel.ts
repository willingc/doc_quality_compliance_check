export type HelpNavigationCard = { id: string; title: string; href: string; tone: 'blue' | 'emerald' | 'violet' };
export type HelpCenterSummary = { totalQas: number; totalGlossaryTerms: number; totalSnippets: number };
export type QaEntry = { id: string; question: string; answer: string; tags: string[] };
export type GlossaryTerm = { id: string; term: string; definition: string; domain: string };
export type HelpSnippet = { id: string; title: string; body: string };

export const HELP_NAVIGATION_CARDS: HelpNavigationCard[] = [{ id: 'qa', title: 'Q&A', href: '/help/qa', tone: 'blue' }, { id: 'glossary', title: 'Glossary', href: '/help/glossary', tone: 'violet' }];
export const HELP_QA_ENTRIES: QaEntry[] = [{ id: 'qa-1', question: 'When should a document be approved?', answer: 'After required checks and HITL review.', tags: ['approval'] }];
export const HELP_GLOSSARY_TERMS: GlossaryTerm[] = [{ id: 'g-1', term: 'HITL', definition: 'Human-in-the-loop decision gate', domain: 'governance' }];

export const buildHelpCenterSummary = (): HelpCenterSummary => ({ totalQas: HELP_QA_ENTRIES.length, totalGlossaryTerms: HELP_GLOSSARY_TERMS.length, totalSnippets: 2 });
export const buildHelpSnippets = (): HelpSnippet[] => [{ id: 's-1', title: 'Review order', body: 'Identify document, verify lock, execute Bridge, record rationale.' }, { id: 's-2', title: 'Escalation', body: 'Escalate when mandatory controls are not met.' }];
export const getQaSearchText = (e: QaEntry) => `${e.question} ${e.answer} ${e.tags.join(' ')}`.toLowerCase();
export const getSelectedQaEntry = (entries: QaEntry[], id?: string) => entries.find((e)=>e.id===id) || entries[0];
export const getGlossarySearchText = (t: GlossaryTerm) => `${t.term} ${t.definition} ${t.domain}`.toLowerCase();
export const createGlossaryDraft = (): Omit<GlossaryTerm,'id'> => ({ term: '', definition: '', domain: '' });
export const canSubmitGlossaryDraft = (d: Omit<GlossaryTerm,'id'>) => d.term.trim().length > 1 && d.definition.trim().length > 3;
export const appendGlossaryDraft = (items: GlossaryTerm[], d: Omit<GlossaryTerm,'id'>): GlossaryTerm[] => [{ id: `g-${Date.now()}`, ...d }, ...items];
export const getHelpAccentClass = (tone: HelpNavigationCard['tone']) => tone === 'emerald' ? 'text-emerald-600 bg-emerald-50' : tone === 'violet' ? 'text-violet-600 bg-violet-50' : 'text-blue-600 bg-blue-50';
