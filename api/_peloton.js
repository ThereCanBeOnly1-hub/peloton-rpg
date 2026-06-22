// Shared helpers for the Peloton serverless functions. Files prefixed with "_"
// are not exposed as routes by Vercel, so this stays internal.

export const BASE_URL = process.env.PELOTON_BASE_URL || 'https://api.onepeloton.com';
export const SESSION_COOKIE = 'peloton_session_id';

// Pull the Peloton session id out of the incoming request's Cookie header.
export function getSessionId(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Call the Peloton API with the session cookie attached. Retries once on 401
// (expired session) and backs off 2s on 429 (rate limited), per CLAUDE.md.
// Returns the parsed JSON body; throws { status, error } on failure.
export async function pelotonFetch(path, { sessionId, method = 'GET', body } = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (sessionId) headers.Cookie = `${SESSION_COOKIE}=${sessionId}`;

  const doFetch = () =>
    fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });

  let res = await doFetch();

  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 2000));
    res = await doFetch();
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw { status: res.status, error: text || res.statusText };
  }

  return res.json();
}

// Standard structured error response for the serverless handlers.
export function sendError(res, status, message) {
  res.status(status).json({ error: message, status });
}
