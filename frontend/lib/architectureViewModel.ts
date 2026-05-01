export type Arc42Item = { id: string; title: string; content: string };

function clean(value: string): string | undefined {
  const cleaned = value.replace(/<br\s*\/?>(\n)?/gi, ' ').replace(/[_\	 ]+$/g, '').trim();
  if (!cleaned || /^[_-]+$/.test(cleaned)) return undefined;
  return cleaned;
}

export function parseArc42Field(markdown: string, fieldLabel: string): string | undefined {
  const escaped = fieldLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\*\*${escaped}:\*\*\s*(.+)$`, 'im');
  const match = markdown.match(regex);
  if (!match) return undefined;
  return clean(match[1]);
}

export function parseArc42Title(markdown: string): string {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || 'arc42 Document';
}

export function resolveActiveArc42Template(items: Arc42Item[], requestedId?: string): Arc42Item | undefined {
  return items.find((i) => i.id === requestedId) || items[0];
}

export function buildArc42MetaLine(item: Arc42Item): string {
  const version = parseArc42Field(item.content, 'Version') || 'n/a';
  const status = parseArc42Field(item.content, 'Status') || 'Draft';
  return `Version ${version} · ${status}`;
}
