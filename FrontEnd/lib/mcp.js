// src/lib/mcp.js
const BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
const PERSIST_KEY = 'persist:hackatweeeeeet';

function readToken({ getState } = {}) {
  try {
    const st = getState?.();
    const tok = st?.user?.accessToken;
    if (tok) return tok;
  } catch (_) {}

  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(PERSIST_KEY);
      if (raw) {
        const root = JSON.parse(raw);
        const userStr = root?.user;
        if (userStr) {
          const user = JSON.parse(userStr);
          const tok = user?.accessToken;
          if (tok) return tok;
        }
      }
    }
  } catch (_) {}

  return null;
}

function authHeaders(opts) {
  const token = readToken(opts);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function mcpHealth(opts = {}) {
  const r = await fetch(`${BASE}/mcp/health`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(opts) },
  });
  return r.json();
}

export async function mcpConfig(opts = {}) {
  const r = await fetch(`${BASE}/mcp`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(opts) },
  });
  return r.json();
}

export async function mcpCall(tool, params = {}, opts = {}) {
  const r = await fetch(`${BASE}/mcp/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(opts) },
    body: JSON.stringify({ tool, params }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok || data?.success === false) {
    const message = data?.message || `HTTP ${r.status}`;
    const err = new Error(message);
    err.status = r.status;
    err.data = data;
    throw err;
  }
  return data.result;
}

export async function mcpAgent(messages = [], opts = {}) {
  const userMsg = messages[messages.length - 1]?.content || "";
  const r = await fetch(`http://localhost:8000/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(opts) },
    body: JSON.stringify({ message: userMsg }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok || data?.success === false) {
    const message = data?.message || `HTTP ${r.status}`;
    throw new Error(message);
  }

  return {
    role: "assistant",
    content: data.message,
  };
}