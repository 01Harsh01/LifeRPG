import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, ApiError, setStoredToken } from "../services/api";
import { computeLevelFromXp } from "../utils/xp";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  updateUserOptimistically: (updater: (prev: User | null) => User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeUser(u: User | null): User | null {
  if (!u) return null;
  const computed = computeLevelFromXp(u.xp).level;
  return {
    ...u,
    level: Math.max(u.level || 1, computed),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>("/auth/me");
      setUser(normalizeUser(data.user));
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const data = await api.post<{ user: User; token?: string }>("/auth/login", { email, password });
      if (data.token) setStoredToken(data.token);
      setUser(normalizeUser(data.user));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Login failed.");
      throw e;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, confirmPassword: string) => {
    setError(null);
    try {
      const data = await api.post<{ user: User; token?: string }>("/auth/register", { name, email, password, confirmPassword });
      if (data.token) setStoredToken(data.token);
      setUser(normalizeUser(data.user));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Signup failed.");
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    setStoredToken(null);
    await api.post("/auth/logout").catch(() => {});
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const updateUserOptimistically = useCallback((updater: (prev: User | null) => User | null) => {
    setUser((prev) => normalizeUser(updater(prev)));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, refreshUser, clearError, updateUserOptimistically }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
