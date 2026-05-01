export type RiskActionType = 'create' | 'submit_for_review' | 'approve' | 'request_changes';
export type RiskAction = { action_id: string; record_id: string; action_type: RiskActionType; actor_email: string; actor_role: string; rationale: string; action_date: string };
const localActions: RiskAction[] = [];

export async function fetchRiskActions(limit = 200): Promise<{ items: RiskAction[]; degradedToDemo?: boolean }> { return { items: localActions.slice(0, limit), degradedToDemo: true }; }

export async function appendRiskAction(input: Omit<RiskAction, 'action_id' | 'action_date'>): Promise<{ ok: boolean; item?: RiskAction; message: string; degradedToDemo?: boolean }> {
  const item: RiskAction = { action_id: `RA-${Date.now()}`, action_date: new Date().toISOString(), ...input };
  localActions.unshift(item);
  return { ok: true, item, message: 'Action saved in demo mode', degradedToDemo: true };
}
