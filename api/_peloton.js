// Shared helpers for the Peloton serverless functions. Files prefixed with "_"
// are not exposed as routes by Vercel, so this stays internal.

export const BASE_URL = process.env.PELOTON_BASE_URL || 'https://api.onepeloton.com';
export const SESSION_COOKIE = 'peloton_session_id';

// Peloton's edge blocks unknown clients with a 403 "Endpoint no longer
// accepting requests". It allowlists the official-app User-Agent prefix
// "Peloton/1.0" — verified empirically; even "Peloton/9.18 (...)" gets 403.
// Every server→Peloton request must send this UA.
export const PELOTON_UA = 'Peloton/1.0 (iPhone; iOS 17.0)';

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
  const headers = { 'Content-Type': 'application/json', 'User-Agent': PELOTON_UA };
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
    // Cloudflare rate-limit/bot pages are HTML — collapse to a clean message.
    if (/error\s*1015|rate limited|cloudflare/i.test(text) || text.trimStart().startsWith('<')) {
      throw { status: 429, error: 'Peloton is temporarily rate-limiting requests (Cloudflare). Wait a few minutes and try again.' };
    }
    throw { status: res.status, error: text || res.statusText };
  }

  return res.json();
}

// Standard structured error response for the serverless handlers.
export function sendError(res, status, message) {
  res.status(status).json({ error: message, status });
}
