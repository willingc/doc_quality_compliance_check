export type SopItem = { id: string; title: string; content: string };
export const parseSopDocumentId = (content: string): string | undefined => content.match(/\*\*Document ID:\\*\*\s*([^\n]+)/i)?.[1]?.trim();
export const parseSopTitle = (content: string): string => content.match(/^#\s+(.+)$/m)?.[1]?.trim() || 'Untitled SOP';
export const resolveActiveSop = (items: SopItem[], requestedId?: string): SopItem | undefined => items.find((i)=>i.id===requestedId) || items[0];
