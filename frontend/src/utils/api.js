export async function api(path, options = {}) {
  const base = "http://127.0.0.1:8000"; // 先固定用本機後端

  const res = await fetch(base + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

