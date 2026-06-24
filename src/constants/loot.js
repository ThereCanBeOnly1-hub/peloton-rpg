// Loot dropped on the map when a quest is completed. Pools are keyed by quest
// category so weeks vary; the boss drops bigger treasure. Loot persists for the
// week (stored on the day) and is wiped on a New Week — see useSchedule.
export const LOOT_POOLS = {
  strength: ['sword', 'shield', 'helm'],
  cycle: ['coin', 'potion', 'scroll'],
  boss: ['chest', 'crown'],
};

// Pick a loot id for a completed day, preferring items not already on the board
// this week (so a week doesn't fill with duplicates). Falls back to the full
// pool once everything's been used.
export function pickLoot(category, usedIds = []) {
  const pool = LOOT_POOLS[category] || LOOT_POOLS.strength;
  const fresh = pool.filter((id) => !usedIds.includes(id));
  const choices = fresh.length ? fresh : pool;
  return choices[Math.floor(Math.random() * choices.length)];
}
