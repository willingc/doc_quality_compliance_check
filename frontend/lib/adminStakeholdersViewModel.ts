export type Permission = 'bridge.run' | 'review.approve' | 'doc.edit' | 'admin.read' | 'admin.write';
export type StakeholderProfileUi = { id: string; title: string; description: string; permissions: Permission[]; isActive: boolean };

export const STAKEHOLDER_PERMISSION_CATALOG: Array<{ id: Permission; label: string }> = [
  { id: 'bridge.run', label: 'Run Bridge workflows' },
  { id: 'review.approve', label: 'Approve or reject review' },
  { id: 'doc.edit', label: 'Edit governed documents' },
  { id: 'admin.read', label: 'View admin dashboards' },
  { id: 'admin.write', label: 'Edit admin settings' },
];

export const INITIAL_STAKEHOLDER_PROFILES: StakeholderProfileUi[] = [
  { id: 'architect', title: 'Architect', description: 'Design authority', permissions: ['bridge.run', 'review.approve', 'doc.edit', 'admin.read'], isActive: true },
  { id: 'auditor', title: 'Auditor', description: 'Independent reviewer', permissions: ['bridge.run', 'review.approve', 'admin.read'], isActive: true },
];

export const toStakeholderProfileUi = (record: any): StakeholderProfileUi => ({ id: record.role_id || record.id, title: record.title || 'Role', description: record.description || '', permissions: (record.permissions || []) as Permission[], isActive: Boolean(record.is_active ?? record.isActive ?? true) });
export const getSelectedStakeholderProfile = (profiles: StakeholderProfileUi[], selectedRole: string): StakeholderProfileUi | undefined => profiles.find((p)=>p.id===selectedRole) || profiles[0];
export const normalizeBulkEmployeeNames = (value: string): string[] => value.split(/[\n,;]/).map((x)=>x.trim()).filter(Boolean);
