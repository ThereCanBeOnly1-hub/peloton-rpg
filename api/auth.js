// POST /api/auth — exchange Peloton credentials for a session. The session id
// is stored in an httpOnly cookie set here, so it never reaches client JS.
import { BASE_URL, SESSION_COOKIE, PELOTON_UA, sendError } from './_peloton.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');

  const { username_or_email, password } = req.body || {};
  if (!username_or_email || !password) {
    return sendError(res, 400, 'Missing username_or_email or password');
  }

  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': PELOTON_UA },
      body: JSON.stringify({ username_or_email, password }),
    });

    if (!loginRes.ok) {
      // Peloton returns JSON like { message: "Login failed", ... } — surface
      // just the message so the UI doesn't show a raw JSON blob.
      const text = await loginRes.text().catch(() => '');
      let message = text || 'Login failed';
      try {
        message = JSON.parse(text).message || message;
      } catch {
        /* not JSON — use the raw text */
      }
      return sendError(res, loginRes.status === 401 ? 401 : 502, message);
    }

    const body = await loginRes.json().catch(() => ({}));

    // The session id may arrive in the JSON body (session_id) or only via
    // Peloton's own Set-Cookie header — capture whichever is present. Without a
    // session, "login" would succeed with a junk cookie and every authed call
    // (e.g. classes) would 401 in a loop, so fail loudly instead.
    let sessionId = body.session_id;
    if (!sessionId) {
      const setCookies = loginRes.headers.getSetCookie?.() ||
        [loginRes.headers.get('set-cookie')].filter(Boolean);
      for (const c of setCookies) {
        const m = c?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
        if (m) { sessionId = m[1]; break; }
      }
    }
    // Diagnostic (no secrets): shows where the session came from if logins
    // misbehave. Safe to remove once auth is confirmed stable.
    console.log('[auth] ok=%s bodyKeys=%j sessionResolved=%s', loginRes.ok, Object.keys(body), !!sessionId);

    if (!sessionId) return sendError(res, 502, 'Login succeeded but no session was returned');

    // Only mark Secure over real HTTPS; on `vercel dev` (http://localhost)
    // a Secure cookie can be dropped, which would silently break the session.
    const isHttps = (req.headers['x-forwarded-proto'] || '').includes('https');

    // ~30-day session. httpOnly so client JS can't read it; SameSite=Lax is
    // fine since the SPA and the API share an origin on Vercel.
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE}=${sessionId}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${isHttps ? '; Secure' : ''}`
    );
    res.status(200).json({ ok: true, userId: body.user_id });
  } catch (err) {
    sendError(res, 500, err?.message || 'Auth request failed');
  }
}
