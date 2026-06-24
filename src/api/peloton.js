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

// Fetch a page of classes for a discipline with the engine's filters applied.
export async function getClasses({
  discipline,
  instructorId,
  difficulty, // any | beginner | intermediate | advanced
  maxDuration,
} = {}) {
  const params = new URLSearchParams({ discipline });
  if (instructorId) params.set('instructorId', instructorId);
  if (difficulty && difficulty !== 'any') params.set('difficulty', difficulty);
  if (maxDuration != null) params.set('maxDuration', String(maxDuration));
  const { classes } = await call(`/api/classes?${params.toString()}`);
  return classes;
}

// Deep link to a class detail page; hands off to the Peloton app on mobile.
export function classLink(classId, discipline = 'cycling') {
  return `https://members.onepeloton.com/classes/${discipline}?modal=classDetailsModal&classId=${classId}`;
}

const FOCUS_KEYWORDS = {
  'Upper Body': ['upper', 'arm', 'arms'],
  'Lower Body': ['lower', 'glute', 'leg', 'legs'],
  Core: ['core', 'abs'],
  'Full Body': ['full body', 'total body'],
};

// Pick the best stretch to pair with an active day (rule #5): strength days get
// a focus-matched stretch ≤15 min; cycle days get a general/post-ride one ≤10.
function pickStretch(stretchClasses, { type, focus }) {
  const maxLen = type === 'cycle' ? 10 : 15;
  const eligible = stretchClasses.filter((c) => c.duration <= maxLen);
  if (!eligible.length) return null;

  const keywords =
    type === 'cycle'
      ? ['post-ride', 'post ride', 'cool down', 'cooldown']
      : FOCUS_KEYWORDS[focus] || [];
  const match = eligible.find((c) =>
    keywords.some((k) => c.title.toLowerCase().includes(k))
  );
  return match || eligible[0];
}

// Map a strength focus to a Peloton stretch discipline query. Stretches share
// one discipline; focus matching happens by title keyword in pickStretch.
function classForDay(classes, used) {
  const fresh = classes.find((c) => !used.has(c.id));
  return fresh || classes[0] || null;
}

// Orchestrate a full week: take the engine's skeleton and fill each active day
// with a real class + paired stretch. Returns a new schedule array; days that
// can't be filled keep their null class fields so the UI can show a fallback.
export async function fillSchedule(skeleton, settings = {}) {
  const filters = {
    instructorId: settings.instructorIds?.[0],
    difficulty: settings.difficulty,
    maxDuration: settings.maxDuration,
  };

  // Fetch the pools we'll draw from once, then assign locally. An AuthError
  // must propagate (so the caller can prompt re-login); only tolerate other
  // failures (e.g. one discipline returning nothing) by falling back to [].
  const safe = (args) =>
    getClasses(args).catch((err) => {
      if (err instanceof AuthError) throw err;
      return [];
    });
  const [strength, cycling, stretching] = await Promise.all([
    safe({ discipline: 'strength', ...filters }),
    safe({ discipline: 'cycling', ...filters }),
    safe({ discipline: 'stretching', maxDuration: 15 }),
  ]);

  const usedMain = new Set();
  const usedStretch = new Set();

  return skeleton.map((day) => {
    if (day.type === 'rest') return day;

    const pool = day.type === 'cycle' ? cycling : strength;
    const main = classForDay(pool, usedMain);
    const stretch = pickStretch(
      stretching.filter((c) => !usedStretch.has(c.id)),
      day
    );

    if (main) usedMain.add(main.id);
    if (stretch) usedStretch.add(stretch.id);

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
  });
}
