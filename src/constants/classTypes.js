// UI metadata for the three class types. Icons live in components/icons; this
// is data-only so it can be imported anywhere without pulling in components.
export const TYPE_META = {
  strength: { label: 'Strength', letter: 'S' },
  cycle: { label: 'Cycle', letter: 'C' },
  rest: { label: 'Rest', letter: 'R' },
};

// Sub-label shown under the quest title in modals/tiles.
export const SUB_LABEL = {
  strength: 'Strength',
  cycle: 'Light Cycle',
  rest: 'Rest Day',
};

// Peloton discipline slug per type, used for class deep links.
export const DISCIPLINE = {
  strength: 'strength',
  cycle: 'cycling',
  rest: null,
};
