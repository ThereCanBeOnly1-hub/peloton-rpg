// Client-side fetch wrapper around the /api/* serverless endpoints. Credentials
// live only in the httpOnly session cookie, so every call uses
// `credentials: 'include'` and we never touch the session id here.

// Thrown when the server reports an expired/absent session. The UI catches this
// to prompt a re-login (we can't silently re-auth without stored credentials).
export class AuthError extends Error {
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'AuthError';
  }
}

async function call(path, opts = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new AuthError(data.error);
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export function login(username_or_email, password) {
  return call('/api/auth', {
    method: 'POST',
    body: JSON.stringify({ username_or_email, password }),
  });
}

let instructorCache = null;
export async function getInstructors() {
  if (instructorCache) return instructorCache;
  const { instructors } = await call('/api/instructors');
  instructorCache = instructors;
  return instructors;
}

// Fetch a discipline's class pool. Focus / favorite-instructor / difficulty
// selection all happen client-side (see pickMain) so the pool stays broad.
async function getClasses({ discipline, maxDuration } = {}) {
  const params = new URLSearchParams({ discipline });
  if (maxDuration != null) params.set('maxDuration', String(maxDuration));
  const { classes } = await call(`/api/classes?${params.toString()}`);
  return classes;
}

// Deep link to a class detail page; hands off to the Peloton app on mobile.
export function classLink(classId, discipline = 'cycling') {
  return `https://members.onepeloton.com/classes/${discipline}?modal=classDetailsModal&classId=${classId}`;
}

// Title keywords that identify a class's body focus. Used to pick a strength
// class (and stretch) matching the day's assigned focus.
const FOCUS_KEYWORDS = {
  'Upper Body': ['upper body', 'arms', 'arm', 'shoulders', 'chest', 'back', 'push', 'pull', 'bis & tris', 'biceps', 'triceps'],
  'Lower Body': ['lower body', 'glutes', 'glutes & legs', 'legs', 'leg'],
  Core: ['core', 'abs', 'ab '],
  'Full Body': ['full body', 'total body'],
};

function matchesFocus(title, focus) {
  const kws = FOCUS_KEYWORDS[focus];
  if (!kws) return true; // no focus (e.g. cycle) → anything matches
  const t = (title || '').toLowerCase();
  return kws.some((k) => t.includes(k));
}

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Narrow a candidate set toward a difficulty level (soft — keeps variety, never
// empties). difficulty_rating_avg is 0–10; 'any' applies no bias.
function biasByDifficulty(choices, difficulty) {
  if (!difficulty || difficulty === 'any' || choices.length <= 2) return choices;
  const sorted = [...choices].sort((a, b) => (a.difficulty ?? 6.5) - (b.difficulty ?? 6.5));
  const half = Math.ceil(sorted.length / 2);
  if (difficulty === 'beginner') return sorted.slice(0, half);
  if (difficulty === 'advanced') return sorted.slice(-half);
  // intermediate: the middle of the range
  const lo = Math.floor(sorted.length * 0.25);
  return sorted.slice(lo, lo + half);
}

// Pick a main class from a pool using priority tiers (best first):
//   1. favorite instructor AND matching focus
//   2. matching focus (any instructor) — keeps the muscle-group rotation
//   3. favorite instructor (any focus)
//   4. anything
// Within the best non-empty tier, prefer classes not used yet this week, bias
// toward the requested difficulty, then pick RANDOMLY for variety (so re-roll
// cycles through the whole set, not just two).
function pickMain(pool, { focus, favorites = [], used = new Set(), excludeId, difficulty } = {}) {
  if (!pool.length) return null;
  const favSet = new Set(favorites);
  const candidates = pool.filter((c) => c.id !== excludeId);
  const base = candidates.length ? candidates : pool;
  const focusMatch = (c) => matchesFocus(c.title, focus);
  const isFav = (c) => favSet.size === 0 || favSet.has(c.instructorId);

  const tiers = [
    base.filter((c) => isFav(c) && focusMatch(c)),
    base.filter((c) => focusMatch(c)),
    base.filter((c) => isFav(c)),
    base,
  ];
  const tier = tiers.find((t) => t.length) || base;
  const fresh = tier.filter((c) => !used.has(c.id));
  const choices = biasByDifficulty(fresh.length ? fresh : tier, difficulty);
  return rand(choices);
}

// Pick a stretch to pair with a day. Cycle → a post-ride/cool-down ≤10 min;
// strength → a focus-matched stretch ≤15 min, never a ride or warm-up class.
// Random within the matching set so re-roll varies the stretch too.
function pickStretch(pool, { type, focus, used = new Set() } = {}) {
  const maxLen = type === 'cycle' ? 10 : 15;
  let eligible = pool.filter((c) => c.duration <= maxLen && !used.has(c.id));
  if (!eligible.length) eligible = pool.filter((c) => c.duration <= maxLen);
  if (!eligible.length) return null;

  const isRide = (t) => /ride|cycl/i.test(t);
  const isWarmup = (t) => /warm[\s-]?up|pre[\s-]?ride/i.test(t);

  if (type === 'cycle') {
    const post = eligible.filter((c) => /post[\s-]?ride|cool[\s-]?down/i.test(c.title));
    if (post.length) return rand(post);
    const nonWarm = eligible.filter((c) => !isWarmup(c.title));
    return rand(nonWarm.length ? nonWarm : eligible);
  }
  // Strength: focus-matched, non-ride, non-warm-up.
  const clean = eligible.filter((c) => !isRide(c.title) && !isWarmup(c.title));
  const baseE = clean.length ? clean : eligible;
  const focusM = baseE.filter((c) => matchesFocus(c.title, focus));
  if (focusM.length) return rand(focusM);
  const general = baseE.filter((c) => /full body|total body|stretch/i.test(c.title));
  return rand(general.length ? general : baseE);
}

// Fetch the three discipline pools once (AuthError propagates so the caller can
// prompt re-login; other failures fall back to []).
async function fetchPools({ maxDuration }) {
  const safe = (args) =>
    getClasses(args).catch((err) => {
      if (err instanceof AuthError) throw err;
      return [];
    });
  const [strength, cycling, stretching] = await Promise.all([
    safe({ discipline: 'strength', maxDuration }),
    safe({ discipline: 'cycling', maxDuration }),
    safe({ discipline: 'stretching' }),
  ]);
  return { strength, cycling, stretching };
}

function applyPick(day, main, stretch) {
  return {
    ...day,
    classId: main?.id ?? null,
    name: main?.title ?? null,
    instructor: main?.instructor ?? null,
    duration: main?.duration ?? null,
    stretchClassId: stretch?.id ?? null,
    stretchName: stretch?.title ?? null,
    stretchDuration: stretch?.duration ?? null,
  };
}

// Orchestrate a full week: fill each active day with a focus-matched class
// (favoring favorite instructors, rotating muscle groups) + a paired stretch.
export async function fillSchedule(skeleton, settings = {}) {
  const favorites = settings.instructorIds || [];
  const { strength, cycling, stretching } = await fetchPools(settings);

  const usedMain = new Set();
  const usedStretch = new Set();

  return skeleton.map((day) => {
    if (day.type === 'rest') return day;
    const pool = day.type === 'cycle' ? cycling : strength;
    const main = pickMain(pool, { focus: day.focus, favorites, used: usedMain, difficulty: settings.difficulty });
    if (main) usedMain.add(main.id);
    const stretch = pickStretch(stretching, { type: day.type, focus: day.focus, used: usedStretch });
    if (stretch) usedStretch.add(stretch.id);
    return applyPick(day, main, stretch);
  });
}

// Re-roll a single day: fetch fresh pools and pick a new class (different from
// the current one) + re-paired stretch. `overrides` can narrow difficulty/length
// (e.g. the "make it easier" hatch).
export async function rollDay(day, settings = {}, overrides = {}) {
  const type = overrides.type || (day.type === 'rest' ? 'strength' : day.type);
  const focus = overrides.focus ?? day.focus ?? 'Full Body';
  const favorites = settings.instructorIds || [];
  const difficulty = overrides.difficulty ?? settings.difficulty;
  const maxDuration = overrides.maxDuration ?? settings.maxDuration;
  const discipline = type === 'cycle' ? 'cycling' : 'strength';

  const [pool, stretching] = await Promise.all([
    getClasses({ discipline, maxDuration }),
    getClasses({ discipline: 'stretching' }),
  ]);

  const main = pickMain(pool, { focus, favorites, excludeId: day.classId, difficulty });
  const stretch = pickStretch(stretching, { type, focus });
  return { type, focus, main, stretch };
}
