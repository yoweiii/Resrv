import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext";

export default function LoginRegisterModal() {
  const { showToast } = useToast();
  const { authOpen, closeAuth, authMode, openAuth, register, login } = useAuth();
  const panelRef = useRef(null);

  const isLogin = authMode === "login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (authOpen) {
      setEmail(""); setPassword(""); setName("");
      setErr(""); setLoading(false);
    }
  }, [authOpen, authMode]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && authOpen && closeAuth();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authOpen, closeAuth]);

  function onBackdropClick(e) {
    if (panelRef.current && !panelRef.current.contains(e.target)) closeAuth();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("請輸入有效的 Email");
    if (password.length < 6) return setErr("密碼至少 6 碼");
    if (!isLogin && name.trim() === "") return setErr("請輸入姓名");

    try {
      setLoading(true);
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ name, email, password });
        showToast("註冊成功，請重新登入");
        openAuth("login");
        setLoading(false);
        return;
      }
      setLoading(false);
      closeAuth();
    } catch (e) {
      setLoading(false);
      try {
        const msg = JSON.parse(e.message)?.detail || e.message;
        setErr(msg || "發生錯誤");
      } catch {
        setErr(e.message || "發生錯誤");
      }
    }
  }

  if (!authOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4" onMouseDown={onBackdropClick}>
      <div ref={panelRef} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onMouseDown={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{isLogin ? "登入" : "註冊"}</h2>
          <button onClick={closeAuth} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="Close">✕</button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">姓名</label>
              <input className="w-full border rounded px-3 py-2 outline-none" value={name} onChange={(e)=>setName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className="w-full border rounded px-3 py-2 outline-none"
                   value={email} onChange={(e)=>setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">密碼</label>
            <input type="password" className="w-full border rounded px-3 py-2 outline-none"
                   value={password} onChange={(e)=>setPassword(e.target.value)} />
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}
          <button type="submit" disabled={loading}
                  className="w-full rounded-md bg-[#e4b326] py-2 text-white hover:bg-[#b22a2a] transition disabled:opacity-60">
            {loading ? "處理中…" : isLogin ? "登入" : "註冊"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          {isLogin ? (
            <>還沒有帳號？ <button className="text-blue-600 hover:underline" onClick={() => openAuth("register")}>去註冊</button></>
          ) : (
            <>已有帳號？ <button className="text-blue-600 hover:underline" onClick={() => openAuth("login")}>去登入</button></>
          )}
        </div>
      </div>
    </div>
  );
}