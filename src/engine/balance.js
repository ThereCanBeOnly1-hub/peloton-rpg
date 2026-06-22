// Balance engine — the core logic. Takes weekly preferences and returns a
// valid 7-day skeleton (types, focus, boss, status). Class data is filled in
// later by the API layer; this module stays pure and API-free so it can be
// tested on its own. See CLAUDE.md "Balance Engine" for the rules.

export const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
export const STRENGTH_FOCUS = ['Upper Body', 'Lower Body', 'Core', 'Full Body'];

const DEFAULT_PREFS = {
  strengthDays: 3,
  cycleCount: 1,
  difficultyMin: 1,
  difficultyMax: 10,
  instructorIds: [],
  maxDuration: 60,
};

// Curated, non-adjacent active-day placements for the common counts. Each is a
// set of weekday indices (0 = MON). Picking from a small pool gives week-to-week
// variety while guaranteeing rule #2 (no two hard days back-to-back).
const PLACEMENTS = {
  1: [[3], [2], [4]],
  2: [[1, 4], [2, 5], [0, 4], [1, 5]],
  3: [[0, 3, 6], [1, 3, 5], [0, 2, 5], [1, 4, 6]],
  4: [[0, 2, 4, 6]],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Choose which weekday indices are active. Prefers a curated non-adjacent set;
// for counts above 4 (impossible to keep fully separated in 7 days) it falls
// back to even spacing and relaxes the back-to-back rule as little as possible.
function chooseActivePositions(activeCount) {
  if (PLACEMENTS[activeCount]) return [...pick(PLACEMENTS[activeCount])].sort((a, b) => a - b);

  const positions = [];
  for (let i = 0; i < activeCount; i++) {
    positions.push(Math.min(6, Math.round((i * 7) / activeCount)));
  }
  // Dedupe collisions by nudging forward into the next free slot.
  const used = new Set();
  return positions
    .map((p) => {
      let q = p;
      while (used.has(q) && q < 6) q++;
      while (used.has(q) && q > 0) q--;
      used.add(q);
      return q;
    })
    .sort((a, b) => a - b);
}

// Rotate focus areas so the same muscle group isn't hit twice in a row.
// 2 days → Upper + Lower; 3 days → Upper + Lower + Core; otherwise cycle.
function assignFocuses(strengthCount) {
  if (strengthCount === 2) return ['Upper Body', 'Lower Body'];
  if (strengthCount === 3) return ['Upper Body', 'Lower Body', 'Core'];
  if (strengthCount === 1) return ['Full Body'];
  return Array.from({ length: strengthCount }, (_, i) => STRENGTH_FOCUS[i % STRENGTH_FOCUS.length]);
}

// Map a real Date onto this Mon–Sun week. Past weekdays are 'done', the current
// weekday is 'today', the rest are 'upcoming'. JS getDay(): 0 = Sun.
function statusFor(index, now = new Date()) {
  const todayIdx = (now.getDay() + 6) % 7; // shift so Monday = 0
  if (index < todayIdx) return 'done';
  if (index === todayIdx) return 'today';
  return 'upcoming';
}

function emptyClassFields() {
  return {
    classId: null,
    name: null,
    instructor: null,
    duration: null,
    stretchClassId: null,
    stretchName: null,
    stretchDuration: null,
  };
}

// Build the 7-day schedule skeleton from user preferences. Returns day objects
// with type/focus/boss/status set and class fields nulled out for the API layer
// to populate. `now` is injectable for testing.
export function buildWeek(prefs = {}, now = new Date()) {
  const p = { ...DEFAULT_PREFS, ...prefs };
  const strengthDays = Math.max(0, Math.min(7, p.strengthDays));
  const cycleCount = Math.max(0, Math.min(7 - strengthDays, p.cycleCount));
  const activeCount = Math.min(7, strengthDays + cycleCount);

  const activePositions = chooseActivePositions(activeCount);

  // Place the cycle day in the middle of the active set so strength stays
  // spread across the week (rule #3). Remaining active slots are strength.
  const midActive = Math.floor(activePositions.length / 2);
  const cyclePositions = new Set();
  for (let i = 0; i < cycleCount; i++) {
    // Spread multiple cycle days around the middle; for the usual count of 1
    // this just takes the middle slot.
    cyclePositions.add(activePositions[(midActive + i) % activePositions.length]);
  }

  const strengthPositions = activePositions.filter((pos) => !cyclePositions.has(pos));
  const focuses = assignFocuses(strengthPositions.length);
  const lastStrengthPos = strengthPositions[strengthPositions.length - 1];

  return WEEKDAYS.map((day, index) => {
    const isCycle = cyclePositions.has(index);
    const isStrength = strengthPositions.includes(index);
    const type = isCycle ? 'cycle' : isStrength ? 'strength' : 'rest';
    const focus = isStrength ? focuses[strengthPositions.indexOf(index)] : null;

    return {
      day,
      type,
      focus,
      // Rule #4: the last strength day of the week is the boss.
      boss: index === lastStrengthPos,
      status: statusFor(index, now),
      ...emptyClassFields(),
    };
  });
}
