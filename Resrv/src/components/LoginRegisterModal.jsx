import React from "react"
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
// import { api } from "../../utils/api.js"; // 之後接後端

export default function AuthModal() {
  const { authOpen, closeAuth, authMode, openAuth, setUser } = useAuth();
  const panelRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // 開啟時清空
  useEffect(() => {
    if (authOpen) {
      setEmail("");
      setPassword("");
      setErr("");
      setLoading(false);
    }
  }, [authOpen, authMode]);

  // ESC 關閉
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && authOpen && closeAuth();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authOpen, closeAuth]);

  // 點 backdrop 關閉
  function onBackdropClick(e) {
    if (panelRef.current && !panelRef.current.contains(e.target)) closeAuth();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("請輸入有效的 Email");
    if (password.length < 6) return setErr("密碼至少 6 碼");

    try {
      setLoading(true);
      // 之後接 FastAPI：
      // const path = authMode === "login" ? "/auth/login" : "/auth/register";
      // const data = await api(path, { method: "POST", body: { email, password }});
      // setUser(data.user);

      // demo
      setTimeout(() => {
        setUser({ id: 1, name: "Demo User", email });
        setLoading(false);
        closeAuth();
      }, 600);
    } catch (e) {
      setLoading(false);
      setErr(e?.data?.detail || e.message || "發生錯誤");
    }
  }

  if (!authOpen) return null;

  const isLogin = authMode === "login";

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onBackdropClick}
    >
      <div
        ref={panelRef}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isLogin ? "登入" : "註冊"}
          </h2>
          <button
            onClick={closeAuth}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 outline-none"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete={isLogin ? "email" : "new-email"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">密碼</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 outline-none"
              placeholder="至少 6 碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#e4b326] py-2 text-white hover:bg-[#b22a2a] transition disabled:opacity-60"
          >
            {loading ? "處理中…" : isLogin ? "登入" : "註冊"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          {isLogin ? (
            <>
              還沒有帳號？{" "}
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => openAuth("register")}
              >
                去註冊
              </button>
            </>
          ) : (
            <>
              已有帳號？{" "}
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => openAuth("login")}
              >
                去登入
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
