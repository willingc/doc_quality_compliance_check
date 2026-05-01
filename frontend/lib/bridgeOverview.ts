import type { BridgeRun } from './mockStore';

export type BridgeOverviewStat = { id: string; label: string; value: number | string; tone: 'blue' | 'emerald' | 'amber' | 'rose' };

export const bridgeToneClasses: Record<BridgeOverviewStat['tone'], string> = {
  blue: 'bg-blue-50 text-blue-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
};

export function bridgeOverviewStats(runs: BridgeRun[] = []): BridgeOverviewStat[] {
  return [
    { id: 'total', label: 'Total Runs', value: runs.length, tone: 'blue' },
    { id: 'done', label: 'Done', value: runs.filter((r)=>r.status==='Done').length, tone: 'emerald' },
    { id: 'running', label: 'Running', value: runs.filter((r)=>r.status==='Running').length, tone: 'amber' },
    { id: 'error', label: 'Error', value: runs.filter((r)=>r.status==='Error').length, tone: 'rose' },
  ];
}
