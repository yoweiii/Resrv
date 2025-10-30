import { createContext, useContext, useEffect, useState, useCallback } from "react";
import React from "react"

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"

  const openAuth = useCallback((mode = "login") => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  // 之後可把 token 放 localStorage，這裡先留鉤子
  useEffect(() => {
    // const saved = localStorage.getItem("token");
    // if (saved) setUser({ ...decode/sync profile });
  }, []);

  const value = {
    user,
    setUser,
    authOpen,
    authMode,
    openAuth,
    closeAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
