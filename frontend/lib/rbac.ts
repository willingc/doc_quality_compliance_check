export type Permission = 'bridge.run' | 'review.approve' | 'doc.edit' | 'admin.read' | 'admin.write';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ['bridge.run', 'review.approve', 'doc.edit', 'admin.read', 'admin.write'],
  architect: ['bridge.run', 'review.approve', 'doc.edit', 'admin.read'],
  auditor: ['bridge.run', 'review.approve', 'admin.read'],
  editor: ['doc.edit', 'bridge.run'],
  reviewer: ['review.approve', 'bridge.run'],
  user: [],
};

export function hasPermission(user: { roles?: string[] } | null | undefined, permission: Permission): boolean {
  if (!user?.roles?.length) return false;
  return user.roles.some((role) => (ROLE_PERMISSIONS[role] || []).includes(permission));
}
