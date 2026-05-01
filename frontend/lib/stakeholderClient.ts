export type StakeholderProfileRecord = { role_id: string; title: string; description: string; permissions: string[]; is_active: boolean };
export type StakeholderEmployeeAssignment = { assignment_id: string; role_id: string; employee_name: string; assigned_at: string };

const demoProfiles: StakeholderProfileRecord[] = [
  { role_id: 'architect', title: 'Architect', description: 'Owns architecture governance.', permissions: ['bridge.run', 'review.approve'], is_active: true },
  { role_id: 'auditor', title: 'Auditor', description: 'Performs independent review.', permissions: ['review.approve'], is_active: true },
];
const assignmentsByRole: Record<string, StakeholderEmployeeAssignment[]> = { architect: [{ assignment_id: 'ASSIGN-1', role_id: 'architect', employee_name: 'Maria', assigned_at: new Date().toISOString() }] };

export const fetchStakeholderProfiles = async (_includeInactive = false): Promise<StakeholderProfileRecord[]> => demoProfiles;
export async function saveStakeholderProfile(roleId: string, patch: Partial<StakeholderProfileRecord>): Promise<StakeholderProfileRecord> {
  const i = demoProfiles.findIndex((x)=>x.role_id===roleId);
  if(i<0){ const c: StakeholderProfileRecord = { role_id: roleId, title: patch.title || roleId, description: patch.description || '', permissions: patch.permissions || [], is_active: patch.is_active ?? true }; demoProfiles.push(c); return c; }
  demoProfiles[i] = { ...demoProfiles[i], ...patch, role_id: roleId };
  return demoProfiles[i];
}
export const fetchStakeholderAssignments = async (roleId: string): Promise<StakeholderEmployeeAssignment[]> => assignmentsByRole[roleId] || [];
export async function addStakeholderAssignment(roleId: string, employeeName: string): Promise<StakeholderEmployeeAssignment> { const item = { assignment_id: `ASSIGN-${Date.now()}`, role_id: roleId, employee_name: employeeName, assigned_at: new Date().toISOString() }; assignmentsByRole[roleId] = [...(assignmentsByRole[roleId]||[]), item]; return item; }
export const removeStakeholderAssignment = async (roleId: string, assignmentId: string): Promise<void> => { assignmentsByRole[roleId] = (assignmentsByRole[roleId]||[]).filter((x)=>x.assignment_id!==assignmentId); };
