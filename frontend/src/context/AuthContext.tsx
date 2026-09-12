import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, ApiError } from "../services/api";
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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>("/auth/me");
      setUser(data.user);
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
      const data = await api.post<{ user: User }>("/auth/login", { email, password });
      setUser(data.user);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Login failed.");
      throw e;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, confirmPassword: string) => {
    setError(null);
    try {
      const data = await api.post<{ user: User }>("/auth/register", { name, email, password, confirmPassword });
      setUser(data.user);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Signup failed.");
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, refreshUser, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
