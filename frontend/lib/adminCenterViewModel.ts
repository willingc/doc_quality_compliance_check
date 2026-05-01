export type AdminNavigationCard = { id: string; title: string; description: string; href: string; tone: 'blue' | 'emerald' | 'violet' };
export type AdminCenterSummary = { totalModules: number; activeModules: number; alerts: number };

export const ADMIN_NAVIGATION_CARDS: AdminNavigationCard[] = [
  { id: 'observability', title: 'Observability', description: 'Prompt, quality, and workflow telemetry.', href: '/admin/observability', tone: 'blue' },
  { id: 'stakeholders', title: 'Stakeholders', description: 'Role templates and rights management.', href: '/admin/stakeholders', tone: 'violet' },
];

export const buildAdminCenterSummary = (): AdminCenterSummary => ({ totalModules: ADMIN_NAVIGATION_CARDS.length, activeModules: ADMIN_NAVIGATION_CARDS.length, alerts: 0 });
export const getAdminAccentClass = (tone: AdminNavigationCard['tone']) => tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : tone === 'violet' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700';
