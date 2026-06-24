// Difficulty levels. Peloton's difficulty_rating_avg (0–10) clusters high and
// varies by discipline, so we treat these as a *soft preference* (sort, never a
// hard filter that returns nothing) — see api/classes.js.
export const DIFFICULTY_LEVELS = [
  { id: 'any', label: 'Any' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];
