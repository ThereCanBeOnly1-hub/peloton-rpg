// GET /api/classes — fetch the Peloton class library for a discipline,
// normalized to the fields the app uses. Returns a POOL; the client picks the
// right class per day (focus rotation + favorite instructors across all
// favorites + stretch pairing), so this endpoint stays simple.
//   discipline=cycling|strength|stretching  (required)
//   difficulty=any|beginner|intermediate|advanced, maxDuration (minutes), limit
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

  const {
    discipline,
    difficulty = 'any', // any | beginner | intermediate | advanced
    maxDuration,
    limit = '60',
    page = '0',
  } = req.query;

  if (!discipline) return sendError(res, 400, 'Missing discipline');

  // The web app browses by `browse_category` (strength|cycling|stretching|…),
  // not `fitness_discipline` — mirror it exactly. Note: Peloton's `duration`
  // param is an EXACT match (class-length bucket), not a max, so we DON'T send
  // it — we cap length client-side below instead. A generous limit gives the
  // client room to match focus + favorite instructors.
  const params = new URLSearchParams({
    browse_category: discipline,
    content_format: 'audio,video',
    limit,
    page,
    sort_by: 'original_air_time',
    desc: 'true',
  });

  try {
    const data = await pelotonFetch(`/api/v2/ride/archived?${params.toString()}`, { token });
    const instructorsById = {};
    for (const i of data.instructors || []) instructorsById[i.id] = i;

    let classes = (data.data || []).map((ride) => normalize(ride, instructorsById));

    // Cap class length here (max, not exact) so we never zero out a discipline.
    if (maxDuration) {
      const cap = Number(maxDuration);
      const within = classes.filter((c) => c.duration <= cap);
      if (within.length) classes = within; // keep all if nothing fits, rather than empty
    }

    // Difficulty is a SOFT preference, not a hard filter — difficulty_rating_avg
    // clusters high (~7–8) and varies by discipline, so a hard range returns
    // nothing. Instead, sort so classes matching the requested level come first;
    // callers take the top match and we never return an empty list.
    if (difficulty !== 'any') {
      const rank = (c) => {
        const d = c.difficulty ?? 6.5; // assume mid if unrated
        if (difficulty === 'beginner') return d; // easiest first
        if (difficulty === 'advanced') return -d; // hardest first
        return Math.abs(d - 7); // intermediate: closest to ~7
      };
      classes.sort((a, b) => rank(a) - rank(b));
    }

    res.status(200).json({ classes });
  } catch (err) {
    // 401 → token expired/invalid; client re-authenticates (see peloton.js).
    sendError(res, err.status || 500, err.error || 'Failed to fetch classes');
  }
}
