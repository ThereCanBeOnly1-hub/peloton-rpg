// GET /api/classes — fetch + filter the Peloton class library, normalized to
// the fields the app actually uses. Query params mirror the engine's filters:
//   discipline=cycling|strength|stretching  (required)
//   instructorId, difficultyMin, difficultyMax, maxDuration (minutes), limit
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
    instructorId,
    difficultyMin,
    difficultyMax,
    maxDuration,
    limit = '20',
    page = '0',
  } = req.query;

  if (!discipline) return sendError(res, 400, 'Missing discipline');

  // The web app browses by `browse_category` (strength|cycling|stretching|…),
  // not `fitness_discipline` — mirror it exactly.
  const params = new URLSearchParams({
    browse_category: discipline,
    content_format: 'audio,video',
    limit,
    page,
    sort_by: 'original_air_time',
    desc: 'true',
  });
  if (instructorId) params.set('instructor_id', instructorId);
  if (maxDuration) params.set('duration', String(Number(maxDuration) * 60));

  try {
    const data = await pelotonFetch(`/api/v2/ride/archived?${params.toString()}`, { token });
    const instructorsById = {};
    for (const i of data.instructors || []) instructorsById[i.id] = i;

    let classes = (data.data || []).map((ride) => normalize(ride, instructorsById));

    // Difficulty filtering is done here rather than via API params because the
    // proxy (overall_rating_avg) isn't a server-side filter on this endpoint.
    const min = difficultyMin != null ? Number(difficultyMin) : null;
    const max = difficultyMax != null ? Number(difficultyMax) : null;
    if (min != null || max != null) {
      classes = classes.filter((c) => {
        if (c.difficulty == null) return true; // keep unrated rather than drop
        if (min != null && c.difficulty < min) return false;
        if (max != null && c.difficulty > max) return false;
        return true;
      });
    }

    res.status(200).json({ classes });
  } catch (err) {
    // 401 → token expired/invalid; client re-authenticates (see peloton.js).
    sendError(res, err.status || 500, err.error || 'Failed to fetch classes');
  }
}
