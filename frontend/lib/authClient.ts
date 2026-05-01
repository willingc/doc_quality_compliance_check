export type AuthUser = {
  email: string;
  roles: string[];
  org?: string;
};

export type AuthHealth = {
  online: boolean;
  version?: string;
};

function buildUrl(path: string, originEnv = 'NEXT_PUBLIC_API_ORIGIN'): string {
  const origin = process.env[originEnv]?.trim();
  if (!origin) return path;
  return `${origin.replace(/\/$/, '')}${path}`;
}

async function parseJson(res: Response): Promise<Record<string, any>> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function request<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(buildUrl(path), {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const payload = await parseJson(res);
  if (!res.ok) throw new Error(payload?.message || `Request failed (${res.status})`);
  return payload as T;
}

export async function loginWithPassword(email: string, password: string, rememberSession = true): Promise<AuthUser> {
  const payload = await request<{ user?: AuthUser }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, remember_session: rememberSession }),
  });
  return payload.user || { email, roles: ['user'], org: 'qm' };
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const payload = await request<{ user?: AuthUser; email?: string; roles?: string[]; org?: string }>('/api/v1/auth/me', { method: 'GET' });
  if (payload.user) return payload.user;
  if (payload.email) return { email: payload.email, roles: payload.roles || ['user'], org: payload.org || 'qm' };
  throw new Error('Session not found');
}

export async function logoutSession(): Promise<void> {
  await request('/api/v1/auth/logout', { method: 'POST' });
}

export async function requestPasswordRecovery(email: string): Promise<{ message: string; reset_url?: string }> {
  return request('/api/v1/auth/recovery/request', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function verifyRecoveryToken(token: string): Promise<{ valid: boolean }> {
  if (!token) return { valid: false };
  return request(`/api/v1/auth/recovery/verify?token=${encodeURIComponent(token)}`, { method: 'GET' });
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ message: string }> {
  return request('/api/v1/auth/recovery/reset', { method: 'POST', body: JSON.stringify({ token, new_password: newPassword }) });
}

export async function checkAuthServiceHealth(): Promise<AuthHealth> {
  const configuredOrigin = process.env.NEXT_PUBLIC_HEALTH_ORIGIN?.trim();
  const url = configuredOrigin ? `${configuredOrigin.replace(/\/$/, '')}/health` : '/health';

  try {
    const response = await fetch(url, { method: 'GET', credentials: 'include' });
    const payload = await parseJson(response);
    if (!response.ok) return { online: false, version: payload?.version };
    return { online: true, version: payload?.version };
  } catch {
    return { online: false };
  }
}
