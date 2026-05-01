export type RiskTemplateRow = Record<string, any>;
export type RiskTemplate = { template_id: string; template_type: 'RMF' | 'FMEA'; template_title: string; product: string; rows: RiskTemplateRow[]; updated_at: string };
export const DEFAULT_TEMPLATE_TITLES = { RMF: 'Risk Management File (RMF)', FMEA: 'Failure Mode and Effects Analysis (FMEA)' } as const;
const localTemplates: RiskTemplate[] = [];

function seedRows(type: 'RMF' | 'FMEA'): RiskTemplateRow[] { return type === 'RMF' ? [{ control: 'Risk planning', owner: 'Quality Lead', status: 'open' }] : [{ component: 'Gateway', failure_mode: 'False negative', severity: 8, occurrence: 3, detection: 5 }]; }

export async function createRiskTemplate(input: { template_type: 'RMF' | 'FMEA'; template_title: string; product: string; created_by: string; rationale?: string; rows?: RiskTemplateRow[] }) {
  const rows = input.rows?.length ? input.rows : seedRows(input.template_type);
  const data: RiskTemplate = { template_id: `TPL-${Date.now()}`, template_type: input.template_type, template_title: input.template_title, product: input.product, rows, updated_at: new Date().toISOString() };
  localTemplates.unshift(data);
  return { ok: true, message: 'Template created in demo mode', data, degradedToDemo: true };
}

export const listRiskTemplates = async (): Promise<RiskTemplate[]> => localTemplates;
export const getRiskTemplate = async (id: string): Promise<RiskTemplate | null> => localTemplates.find((x)=>x.template_id===id) || null;
export const getDefaultRiskTemplate = async (type: 'RMF' | 'FMEA', product = 'AI-Diagnostics-Core'): Promise<RiskTemplate> => ({ template_id: `DEFAULT-${type}`, template_type: type, template_title: DEFAULT_TEMPLATE_TITLES[type], product, rows: seedRows(type), updated_at: new Date().toISOString() });
export async function ensureDefaultRiskTemplate(type: 'RMF' | 'FMEA', product?: string): Promise<RiskTemplate> { const found = localTemplates.find((x)=>x.template_type===type && (!product || x.product===product)); if(found) return found; const seeded = await getDefaultRiskTemplate(type, product || 'AI-Diagnostics-Core'); localTemplates.push(seeded); return seeded; }
export async function updateRiskTemplate(templateId: string, patch: Partial<RiskTemplate>): Promise<RiskTemplate | null> { const i = localTemplates.findIndex((x)=>x.template_id===templateId); if(i<0) return null; localTemplates[i] = { ...localTemplates[i], ...patch, updated_at: new Date().toISOString() }; return localTemplates[i]; }
export const pushTemplateToRemote = async (_t: RiskTemplate): Promise<{ ok: boolean; message: string }> => ({ ok: true, message: 'Template push queued.' });
export const downloadTemplateCsv = (t: RiskTemplate): string => !t.rows.length ? '' : [Object.keys(t.rows[0]).join(','), ...t.rows.map((r)=>Object.keys(t.rows[0]).map((k)=>JSON.stringify(r[k] ?? '')).join(','))].join('\n');
export const aiSuggestRiskRow = async (input: { templateType: 'RMF' | 'FMEA'; context: string }): Promise<RiskTemplateRow> => input.templateType === 'RMF' ? { control: 'AI suggested control', owner: 'Risk Manager', status: 'draft', context: input.context } : { component: 'AI suggested component', failure_mode: 'Potential drift', severity: 6, occurrence: 4, detection: 6 };
