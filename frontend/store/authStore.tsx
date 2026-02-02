"use client";

import React from "react";
import { clearToken, getToken, setToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { User } from "@/types/user";

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
  setAuth: (token: string) => Promise<void>;
  refreshMe: () => Promise<User | null>;
  logout: () => void;
};

const Ctx = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTok] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refreshMe = async () => {
    const t = getToken();
    if (!t) {
      setTok(null);
      setUser(null);
      setLoading(false);
      return null;
    }
    setTok(t);
    try {
      const me = await apiFetch<User>("/users/me", { auth: true });
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAuth = async (newToken: string) => {
    setToken(newToken);
    setTok(newToken);
    const me = await apiFetch<User>("/users/me", { auth: true });
    setUser(me);
  };

  const logout = () => {
    clearToken();
    setTok(null);
    setUser(null);
    if (typeof window !== "undefined") window.location.href = "/login";
  };

  return <Ctx.Provider value={{ token, user, loading, setAuth, refreshMe, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
