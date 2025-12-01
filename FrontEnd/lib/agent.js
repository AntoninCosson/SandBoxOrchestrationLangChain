// lib/agent.js - Agent booking avec streaming SSE
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

export async function agentHealth(opts = {}) {
  const r = await fetch(`${BASE}/mcp/health`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(opts) },
  });
  return r.json();
}

export async function agentConfig(opts = {}) {
  const r = await fetch(`${BASE}/mcp`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(opts) },
  });
  return r.json();
}

export async function callTool(tool, params = {}, opts = {}) {
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
  return data.data || data;
}

/**
 * Stream agent responses via SSE
 * Accumule les tokens en temps réel et retourne la réponse finale
 * 
 * @param {Array} messages - Historique des messages
 * @param {Object} opts - Options (getState, etc)
 * @param {Function} onToken - Callback appelé à chaque token (pour UI progressif)
 * @returns {Promise<Object>} Réponse finale avec message, usage, etc
 */
export async function agentStream(messages = [], opts = {}, onToken = null) {
  const token = readToken(opts);
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Utiliser fetch + ReadableStream pour POST avec SSE
  // EventSource c'est GET only, donc on fait du fetch streaming
  return fetchAgentStream(messages, opts, onToken);
}

/**
 * Implémentation réelle avec fetch + ReadableStream
 * @private
 */
async function fetchAgentStream(messages = [], opts = {}, onToken = null) {
  const token = readToken(opts);

  const response = await fetch(`${BASE}/mcp/agent/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error(`Agent stream failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulatedContent = '';
  let finalResponse = {
    role: 'assistant',
    content: '',
    type: 'text',
    usage: { prompt_tokens: 0, completion_tokens: 0 },
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      const events = buffer.split('\n\n');
      
      buffer = events.pop() || '';

      for (const eventText of events) {
        if (!eventText.trim()) continue;

        const lines = eventText.split('\n');
        let eventType = '';
        let data = null;

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.replace('event:', '').trim();
          } else if (line.startsWith('data:')) {
            const dataStr = line.replace('data:', '').trim();
            try {
              data = JSON.parse(dataStr);
            } catch (e) {
              console.error('[SSE Parse Error]:', dataStr);
              continue;
            }
          }
        }

        if (!eventType || !data) continue;


        switch (eventType) {
          case 'start':
            if (onToken) onToken({ type: 'start', data });
            break;

          case 'token':
            accumulatedContent += data.delta || '';
            finalResponse.content = data.partial || accumulatedContent;
            if (onToken) onToken({ type: 'token', data: { ...data, accumulated: accumulatedContent } });
            // React re-render between tokens
            await new Promise(resolve => setTimeout(resolve, 0));
            break;

          case 'tool_call':
            if (onToken) onToken({ type: 'tool_call', data });
            break;

          case 'complete':
            finalResponse = {
              role: data.role || 'assistant',
              content: data.message || accumulatedContent,
              type: data.type || 'text',
              ...data,
            };
            if (onToken) onToken({ type: 'complete', data });
            break;

          case 'error':
            console.error('[SSE Error]:', data);
            throw new Error(data.message || 'SSE Error');
        }
      }
    }

    return finalResponse;

  } catch (error) {
    // console.error('[fetchAgentStream] Error:', error);
    throw error;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Fallback: Non-streaming agent call (backward compat)
 * @deprecated Use agentStream instead
 */
export async function agentCall(messages = [], opts = {}) {
  const token = readToken(opts);

  const r = await fetch(`${BASE}/mcp/agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok || data?.success === false) {
    const message = data?.message || `HTTP ${r.status}`;
    throw new Error(message);
  }

  return {
    role: 'assistant',
    content: data.data?.content || data.message || '',
    type: data.data?.type || 'text',
  };
}

// Backward compatibility aliases
export const mcpHealth = agentHealth;
export const mcpConfig = agentConfig;
export const mcpCall = callTool;
export const mcpAgent = agentStream;