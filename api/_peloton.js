// Shared helpers for the Peloton serverless functions. Files prefixed with "_"
// are not exposed as routes by Vercel, so this stays internal.

export const BASE_URL = process.env.PELOTON_BASE_URL || 'https://api.onepeloton.com';

// Peloton's class-library API authenticates with an Auth0-issued Bearer token
// (the legacy username/password → session_id cookie no longer authorizes it).
// These are the public web-app Auth0 values, read from the /authorize request.
export const AUTH0_DOMAIN = 'auth.onepeloton.com';
export const AUTH0_CLIENT_ID = 'WVoJxVDdPoFx4RNewvvg6ch2mZ7bwnsM';
export const AUTH0_AUDIENCE = 'https://api.onepeloton.com/';
export const AUTH0_REALM = 'Username-Password-Authentication';
export const AUTH0_SCOPE = 'openid profile email offline_access';

// Our httpOnly cookies holding the Auth0 tokens.
export const TOKEN_COOKIE = 'qb_token';
export const REFRESH_COOKIE = 'qb_refresh';

// Peloton's edge blocks unknown clients with a 403 "Endpoint no longer
// accepting requests"; it allowlists the official-app User-Agent prefix
// "Peloton/1.0" (verified empirically). Send it on every api.onepeloton.com call.
export const PELOTON_UA = 'Peloton/1.0 (iPhone; iOS 17.0)';

// Read the stored Auth0 access token from the incoming request's cookies.
export function getToken(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(new RegExp(`${TOKEN_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getRefreshToken(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(new RegExp(`${REFRESH_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Exchange Peloton credentials for Auth0 tokens via the Resource Owner
// Password grant (password-realm). Returns { access_token, refresh_token,
// expires_in, ... }; throws an Error with .status/.code on failure.
export async function auth0Login(username, password) {
  return auth0Token({
    grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
    realm: AUTH0_REALM,
    username,
    password,
    audience: AUTH0_AUDIENCE,
    scope: AUTH0_SCOPE,
    client_id: AUTH0_CLIENT_ID,
  });
}

// Get a fresh access token from a stored refresh token.
export async function auth0Refresh(refresh_token) {
  return auth0Token({
    grant_type: 'refresh_token',
    refresh_token,
    audience: AUTH0_AUDIENCE,
    scope: AUTH0_SCOPE,
    client_id: AUTH0_CLIENT_ID,
  });
}

async function auth0Token(payload) {
  const res = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error_description || 'Login failed');
    // invalid_grant = bad credentials → treat as 401; everything else 502.
    err.status = data.error === 'invalid_grant' ? 401 : res.status === 401 ? 401 : 502;
    err.code = data.error;
    throw err;
  }
  return data;
}

// Call the Peloton API with the Auth0 Bearer token. Backs off 2s on 429.
// Returns the parsed JSON body; throws { status, error } on failure.
export async function pelotonFetch(path, { token, method = 'GET', body } = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': PELOTON_UA,
    'Peloton-Platform': 'web',
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

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

// Build the Set-Cookie headers that persist the Auth0 tokens (httpOnly).
// Secure only over real HTTPS so `vercel dev` (http://localhost) keeps them.
export function tokenCookies({ access_token, refresh_token, expires_in }, req) {
  const isHttps = (req.headers['x-forwarded-proto'] || '').includes('https');
  const secure = isHttps ? '; Secure' : '';
  const cookies = [
    `${TOKEN_COOKIE}=${access_token}; HttpOnly; Path=/; Max-Age=${expires_in || 36000}; SameSite=Lax${secure}`,
  ];
  if (refresh_token) {
    cookies.push(`${REFRESH_COOKIE}=${refresh_token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${secure}`);
  }
  return cookies;
}

// Standard structured error response for the serverless handlers.
export function sendError(res, status, message) {
  res.status(status).json({ error: message, status });
}
