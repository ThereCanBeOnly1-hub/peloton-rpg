// Set-once user preferences, persisted in localStorage. These apply to every
// "New Week" automatically so the everyday flow needs zero input. Editable in
// the Settings modal, but never required at generation time.
import { DEFAULT_WEEK_TEMPLATE } from '../engine/balance.js';

const KEY = 'questboard.settings';

export const DEFAULT_SETTINGS = {
  instructorIds: [], // favorite instructors (empty = any)
  difficulty: 'any', // any | beginner | intermediate | advanced
  maxDuration: 30, // minutes
  weekTemplate: DEFAULT_WEEK_TEMPLATE, // preferred Mon–Sun day types
  avatar: null, // data URL of the character portrait, or null for the default
};

export function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...DEFAULT_SETTINGS, ...raw };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable — non-fatal */
  }
}
