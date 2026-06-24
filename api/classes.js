// GET /api/classes — fetch the Peloton class library for a discipline,
// normalized to the fields the app uses. Returns a POOL; the client picks the
// right class per day (focus rotation + favorite instructors + difficulty +
// stretch pairing), so this endpoint just fetches and caps length.
//   discipline=cycling|strength|stretching  (required), maxDuration (minutes)
import { getToken, pelotonFetch, sendError } from './_peloton.js';

// Reduce a raw Peloton ride into the shape the client/engine consume. The API
// nests instructor data either inline or in a sibling lookup map, so handle both.
function normalize(ride, instructorsById = {}) {
  const instructorName =
    ride.instructor?.name ||
    instructorsById[ride.instructor_id]?.name ||
    'Peloton';
  return {
    id: ride.id,
    title: ride.title,
    instructor: instructorName,
    instructorId: ride.instructor_id || ride.instructor?.id || null,
    duration: Math.round((ride.duration || 0) / 60), // seconds → minutes
    // 0–10 difficulty. overall_rating_avg is a like-ratio (~0–1), NOT difficulty
    // — use the real difficulty fields, leaving null if absent (kept by filter).
    difficulty: ride.difficulty_rating_avg ?? ride.difficulty_estimate ?? null,
    discipline: ride.fitness_discipline_display_name || ride.fitness_discipline,
    imageUrl: ride.image_url || null,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendError(res, 405, 'Method not allowed');

  const token = getToken(req);
  if (!token) return sendError(res, 401, 'No session — re-authenticate');

  const { discipline, maxDuration } = req.query;

  if (!discipline) return sendError(res, 400, 'Missing discipline');

  // The web app browses by `browse_category` (strength|cycling|stretching|…),
  // not `fitness_discipline` — mirror it exactly. Note: Peloton's `duration`
  // param is an EXACT match (class-length bucket), not a max, so we DON'T send
  // it — we cap length client-side below instead.
  const PAGE_SIZE = 100;
  const PAGES = 2; // deepen the pool (~200/discipline) so focus+favorite filters have room
  const pageUrl = (page) =>
    `/api/v2/ride/archived?${new URLSearchParams({
      browse_category: discipline,
      content_format: 'audio,video',
      limit: String(PAGE_SIZE),
      page: String(page),
      sort_by: 'original_air_time',
      desc: 'true',
    }).toString()}`;

  try {
    // Fetch the pages in parallel and merge (dedupe by id).
    const pages = await Promise.all(
      Array.from({ length: PAGES }, (_, p) => pelotonFetch(pageUrl(p), { token }))
    );
    const instructorsById = {};
    const byId = new Map();
    for (const data of pages) {
      for (const i of data.instructors || []) instructorsById[i.id] = i;
      for (const ride of data.data || []) byId.set(ride.id, ride);
    }

    let classes = [...byId.values()].map((ride) => normalize(ride, instructorsById));

    // Cap class length here (max, not exact) so we never zero out a discipline.
    if (maxDuration) {
      const cap = Number(maxDuration);
      const within = classes.filter((c) => c.duration <= cap);
      if (within.length) classes = within; // keep all if nothing fits, rather than empty
    }

    res.status(200).json({ classes });
  } catch (err) {
    // 401 → token expired/invalid; client re-authenticates (see peloton.js).
    sendError(res, err.status || 500, err.error || 'Failed to fetch classes');
  }
}
