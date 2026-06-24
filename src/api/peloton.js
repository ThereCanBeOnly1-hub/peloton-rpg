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

// Fetch a discipline's class pool. Instructor/focus selection happens client-
// side (see pickMain) so we can honor *all* favorites, not just one.
export async function getClasses({ discipline, difficulty, maxDuration } = {}) {
  const params = new URLSearchParams({ discipline });
  if (difficulty && difficulty !== 'any') params.set('difficulty', difficulty);
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

// Pick a main class from a pool, preferring (in order): the day's focus, the
// user's favorite instructors, and a class not already used this week. Soft at
// every step — never returns null when the pool is non-empty.
function pickMain(pool, { focus, favorites = [], used = new Set(), excludeId } = {}) {
  if (!pool.length) return null;
  const favSet = new Set(favorites);
  const score = (c) => {
    let s = 0;
    if (!matchesFocus(c.title, focus)) s += 4; // focus is the priority
    if (favSet.size && !favSet.has(c.instructorId)) s += 2; // then favorites
    if (used.has(c.id)) s += 1; // then freshness
    if (c.id === excludeId) s += 8; // strongly avoid the current class on reroll
    return s;
  };
  return [...pool].sort((a, b) => score(a) - score(b))[0];
}

// Pick a stretch to pair with a day. Cycle → a post-ride/cool-down ≤10 min;
// strength → a focus-matched stretch ≤15 min, never a ride or warm-up class.
function pickStretch(pool, { type, focus, used = new Set() } = {}) {
  const maxLen = type === 'cycle' ? 10 : 15;
  let eligible = pool.filter((c) => c.duration <= maxLen && !used.has(c.id));
  if (!eligible.length) eligible = pool.filter((c) => c.duration <= maxLen);
  if (!eligible.length) return null;

  const isRide = (t) => /ride|cycl/i.test(t);
  const isWarmup = (t) => /warm[\s-]?up|pre[\s-]?ride/i.test(t);

  if (type === 'cycle') {
    return (
      eligible.find((c) => /post[\s-]?ride|cool[\s-]?down/i.test(c.title)) ||
      eligible.find((c) => !isWarmup(c.title)) ||
      eligible[0]
    );
  }
  // Strength: prefer a focus-matched, non-ride, non-warm-up stretch.
  const clean = eligible.filter((c) => !isRide(c.title) && !isWarmup(c.title));
  const base = clean.length ? clean : eligible;
  return (
    base.find((c) => matchesFocus(c.title, focus)) ||
    base.find((c) => /full body|total body/i.test(c.title)) ||
    base.find((c) => /stretch/i.test(c.title)) ||
    base[0]
  );
}

// Fetch the three discipline pools once (AuthError propagates so the caller can
// prompt re-login; other failures fall back to []).
async function fetchPools(settings) {
  const { difficulty, maxDuration } = settings;
  const safe = (args) =>
    getClasses(args).catch((err) => {
      if (err instanceof AuthError) throw err;
      return [];
    });
  const [strength, cycling, stretching] = await Promise.all([
    safe({ discipline: 'strength', difficulty, maxDuration }),
    safe({ discipline: 'cycling', difficulty, maxDuration }),
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
    const main = pickMain(pool, { focus: day.focus, favorites, used: usedMain });
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
    getClasses({ discipline, difficulty, maxDuration }),
    getClasses({ discipline: 'stretching' }),
  ]);

  const main = pickMain(pool, { focus, favorites, excludeId: day.classId });
  const stretch = pickStretch(stretching, { type, focus });
  return { type, focus, main, stretch };
}
