const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function api(path, { method = 'GET', body } = {}) {
  try {
    const res = await fetch(BASE + path, {
      method,
      credentials: 'include', // without this the browser won't send or store the cookie
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch { /* empty or non-JSON body */ }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: 'Cannot reach the server' } };
  }
}