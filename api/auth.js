// POST /api/auth — exchange Peloton credentials for a session. The session id
// is stored in an httpOnly cookie set here, so it never reaches client JS.
import { BASE_URL, SESSION_COOKIE, sendError } from './_peloton.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');

  const { username_or_email, password } = req.body || {};
  if (!username_or_email || !password) {
    return sendError(res, 400, 'Missing username_or_email or password');
  }

  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username_or_email, password }),
    });

    if (!loginRes.ok) {
      const text = await loginRes.text().catch(() => '');
      return sendError(res, loginRes.status === 401 ? 401 : 502, text || 'Login failed');
    }

    const { session_id, user_id } = await loginRes.json();

    // ~30-day session. httpOnly so client JS can't read it; SameSite=Lax is
    // fine since the SPA and the API share an origin on Vercel.
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE}=${session_id}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`
    );
    res.status(200).json({ ok: true, userId: user_id });
  } catch (err) {
    sendError(res, 500, err?.message || 'Auth request failed');
  }
}
