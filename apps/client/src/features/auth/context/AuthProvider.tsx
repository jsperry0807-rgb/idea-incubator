import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { setAccessToken as setAxiosToken } from '@/axios';
import {
  deleteAccountRequest,
  loginRequest,
  logoutRequest,
  meRequest,
  registerRequest,
  updateProfileRequest,
} from '../api/auth';
import type { LoginInput, RegisterInput, UpdateProfileInput, User } from '../types';
import { AuthContext, type AuthContextValue } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const setAccessToken = useCallback((token: string) => {
    setAxiosToken(token);
  }, []);

  /**
   * Ends the current session. Clears the query cache as well as the token, so a
   * subsequent login cannot render the previous user's ideas, dashboard or
   * notifications out of memory.
   *
   * `queryClient.clear()` also removes the mutation cache and cancels in-flight
   * queries (it destroys each query, which cancels its retryer), so a late
   * response cannot repopulate a cache entry after we are done.
   */
  const clearSession = useCallback(() => {
    setAxiosToken(null);
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  /**
   * Adopts a newly authenticated user, dropping any cache belonging to a
   * different identity first. Keyed on user id so re-authenticating as the same
   * account keeps the cache warm.
   */
  const startSession = useCallback(
    (nextUser: User) => {
      if (user?.id !== nextUser.id) {
        queryClient.clear();
      }
      setUser(nextUser);
    },
    [queryClient, user?.id]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await meRequest();
        if (!cancelled) setUser(me);
      } catch {
        // Not authenticated
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      clearSession();
      setIsLoading(false);
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [clearSession]);

  const login = useCallback(
    async (input: LoginInput) => {
      const res = await loginRequest(input);
      setAccessToken(res.accessToken);
      startSession(res.user);
    },
    [setAccessToken, startSession]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const res = await registerRequest(input);
      setAccessToken(res.accessToken);
      startSession(res.user);
    },
    [setAccessToken, startSession]
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    const updated = await updateProfileRequest(input);
    setUser(updated);
  }, []);

  const deleteAccount = useCallback(
    async (password: string) => {
      await deleteAccountRequest(password);
      clearSession();
    },
    [clearSession]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      updateProfile,
      deleteAccount,
      setAccessToken,
    }),
    [user, isLoading, login, register, logout, updateProfile, deleteAccount, setAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
