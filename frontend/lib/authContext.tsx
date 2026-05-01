import React, { createContext, useContext, useMemo, useState } from 'react';
import { AuthUser, fetchCurrentUser, logoutSession } from './authClient';
import { Permission, hasPermission } from './rbac';

type AuthContextValue = {
  currentUser: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ currentUser, children }: { currentUser: AuthUser | null; children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(currentUser);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      setUser(await fetchCurrentUser());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await logoutSession();
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const value = useMemo(() => ({ currentUser: user, loading, refresh, signOut }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) return { currentUser: null, loading: false, refresh: async () => undefined, signOut: async () => undefined };
  return ctx;
}

export function useCan(permission: Permission): boolean {
  const { currentUser } = useAuth();
  return hasPermission(currentUser, permission);
}
