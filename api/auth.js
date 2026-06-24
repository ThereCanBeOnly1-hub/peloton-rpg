// POST /api/auth — exchange Peloton credentials for an Auth0 Bearer token via
// the Resource Owner Password grant, and store the tokens in httpOnly cookies.
// The class-library API requires this token; the legacy session cookie no
// longer authorizes it.
import { auth0Login, tokenCookies, sendError } from './_peloton.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');

  const { username_or_email, password } = req.body || {};
  if (!username_or_email || !password) {
    return sendError(res, 400, 'Missing username_or_email or password');
  }

  try {
    const tokens = await auth0Login(username_or_email, password);
    res.setHeader('Set-Cookie', tokenCookies(tokens, req));
    res.status(200).json({ ok: true });
  } catch (err) {
    // 401 → bad credentials (invalid_grant); otherwise upstream/Auth0 issue.
    sendError(res, err.status || 500, err.message || 'Auth request failed');
  }
}
