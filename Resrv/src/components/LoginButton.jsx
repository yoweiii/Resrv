import { useAuth } from "../context/AuthContext";
import React from "react"

export default function LoginButton({ className = "" }) {
  const { openAuth, user } = useAuth();

  if (user) {
    return <div className="text-sm text-gray-700">嗨，{user.name}</div>;
  }

  return (
    <button
      className={`bg-[#e4b326] px-3 py-1 rounded-md text-sm text-white hover:bg-[#b22a2a] transition ${className}`}
      onClick={() => openAuth("login")}
      type="button"
    >
      登入
    </button>
  );
}
