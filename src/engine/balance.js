// Balance engine — the core logic. Takes the user's preferred weekly template
// and returns a valid 7-day skeleton (types, focus, boss, status). Class data is
// filled in later by the API layer; this module stays pure and API-free so it
// can be tested on its own. See CLAUDE.md "Balance Engine".

export const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const STRENGTH_FOCUS = ['Upper Body', 'Lower Body', 'Core', 'Full Body'];
const DAY_TYPES = ['strength', 'cycle', 'rest'];

// The default preferred week (Mon–Sun): Strength Mon/Fri/Sat, Cycle Wed, rest
// otherwise. Users override this once in Settings; it then applies every week.
export const DEFAULT_WEEK_TEMPLATE = ['strength', 'rest', 'cycle', 'rest', 'strength', 'strength', 'rest'];

// Rotate focus areas so the same muscle group isn't worked twice in a row.
// 2 strength days → Upper + Lower; 3 → Upper + Lower + Core; otherwise cycle.
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

// Coerce a stored template into a valid 7-entry array of known day types.
function normalizeTemplate(template) {
  const base = Array.isArray(template) && template.length === 7 ? template : DEFAULT_WEEK_TEMPLATE;
  return base.map((t) => (DAY_TYPES.includes(t) ? t : 'rest'));
}

// Build the 7-day schedule skeleton from the preferred week template. Assigns
// rotating focus to strength days, flags the last strength day as the boss, and
// nulls class fields for the API layer to populate. `now` is injectable for tests.
export function buildWeek(settings = {}, now = new Date()) {
  const template = normalizeTemplate(settings.weekTemplate);
  const strengthPositions = template.map((t, i) => (t === 'strength' ? i : -1)).filter((i) => i >= 0);
  const focuses = assignFocuses(strengthPositions.length);
  const lastStrengthPos = strengthPositions[strengthPositions.length - 1];

  return WEEKDAYS.map((day, index) => {
    const type = template[index];
    return {
      day,
      type,
      focus: type === 'strength' ? focuses[strengthPositions.indexOf(index)] : null,
      // Rule #4: the last strength day of the week is the boss.
      boss: index === lastStrengthPos,
      status: statusFor(index, now),
      ...emptyClassFields(),
    };
  });
}
