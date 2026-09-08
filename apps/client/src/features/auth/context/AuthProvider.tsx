import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { setAccessToken as setAxiosToken } from "@/axios";
import { loginRequest, logoutRequest, meRequest, registerRequest } from "../api/auth";
import type { LoginInput, RegisterInput, User } from "../types";
import { AuthContext, type AuthContextValue } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setAccessToken = useCallback((token: string) => {
    setAxiosToken(token);
  }, []);

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
      setUser(null);
      setIsLoading(false);
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const res = await loginRequest(input);
    setAccessToken(res.accessToken);
    setUser(res.user);
  }, [setAccessToken]);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await registerRequest(input);
    setAccessToken(res.accessToken);
    setUser(res.user);
  }, [setAccessToken]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setAxiosToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      setAccessToken,
    }),
    [user, isLoading, login, register, logout, setAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}