import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { authApi, getToken, setToken, clearToken } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); 
  const [loading, setLoading] = useState(false);

  const openAuth = useCallback((mode = "login") => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);
  
  const closeAuth = useCallback(() => setAuthOpen(false), []);

  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) return;
      try {
        setLoading(true);
        const profile = await authApi.me();
        setUser(profile);
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const actions = useMemo(() => ({
    async register({ name, email, password }) {
      const u = await authApi.register({ name, email, password });
      return u;
    },
    async login({ email, password }) {
      const { access_token } = await authApi.login({ email, password });
      setToken(access_token);
      const profile = await authApi.me();
      setUser(profile);
      return profile;
    },
    async logout() {
      clearToken();
      setUser(null);
    },
  }), []);

  const value = { user, setUser, loading, authOpen, authMode, openAuth, closeAuth, ...actions };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}