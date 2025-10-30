// src/utils/api.js
const BASE =
  import.meta.env.PROD
    ? "/api" // 部署後用反向代理或 vercel rewrites 指到 FastAPI
    : "http://localhost:8000/api";

export async function api(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // 若之後用 cookie/session
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.detail || "Request failed"), { status: res.status, data });
  return data;
}
