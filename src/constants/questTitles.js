// Rotating flavor-text pools by class type. The board shows these instead of
// the raw class name. Recently-used titles (last 4 weeks) are tracked in
// localStorage and avoided — see pickQuestTitle().
export const QUEST_TITLES = {
  strength: [
    'Forge the Blade', 'Storm the Keep', 'Hold the Line',
    'Arm the Garrison', 'Duel the Champion', 'Break the Siege',
  ],
  cycle: [
    'Race the Caravan', 'Outrun the Storm', 'Scout the Pass',
    'Ride Before Dawn', 'Cross the Wastes',
  ],
  rest: [
    'Rest at Camp', 'Mend Your Wounds', 'Tend the Fire',
    'Sleep Under Stars', 'Sharpen Your Steel',
  ],
};

const RECENT_KEY = 'questboard.recentTitles';
const RECENT_WEEKS = 4;

// Read the recent-title log: { [title]: weekStamp }. Stale entries (> 4 weeks
// old) are pruned on read so the pool reopens over time.
function readRecent(currentWeek) {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '{}');
    const fresh = {};
    for (const [title, week] of Object.entries(raw)) {
      if (currentWeek - week < RECENT_WEEKS) fresh[title] = week;
    }
    return fresh;
  } catch {
    return {};
  }
}

// Pick a quest title for the given type, avoiding ones used in the last 4
// weeks. `weekStamp` is a monotonically increasing week number (see
// useSchedule). Falls back to the full pool if everything is recently used.
export function pickQuestTitle(type, weekStamp = 0) {
  const pool = QUEST_TITLES[type] || QUEST_TITLES.rest;
  const recent = readRecent(weekStamp);
  const available = pool.filter((t) => !(t in recent));
  const choices = available.length ? available : pool;
  const picked = choices[Math.floor(Math.random() * choices.length)];

  recent[picked] = weekStamp;
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {
    /* localStorage unavailable — non-fatal, titles just won't dedupe */
  }
  return picked;
}
