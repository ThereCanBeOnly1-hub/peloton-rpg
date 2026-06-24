// GET /api/instructors — the instructor list with ids, used to populate filter
// chips. Rarely changes, so the client caches it.
import { getToken, pelotonFetch, sendError } from './_peloton.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendError(res, 405, 'Method not allowed');

  // The instructor list is public on Peloton's side, so a token isn't
  // required — pass it if we have one, otherwise call anonymously.
  const token = getToken(req);

  try {
    const data = await pelotonFetch('/api/instructor?limit=100', { token });
    const instructors = (data.data || [])
      .map((i) => ({ id: i.id, name: i.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.status(200).json({ instructors });
  } catch (err) {
    sendError(res, err.status || 500, err.error || 'Failed to fetch instructors');
  }
}
