// Schedule + progression + settings state. Holds the 7-day schedule, XP/level,
// and the set-once preferences. The everyday flow needs zero input: planWeek()
// reads the saved settings; per-day escape hatches (reroll/easier/skip) let you
// adjust when life gets in the way. All of it persists in localStorage.
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { buildWeek } from '../engine/balance.js';
import { fillSchedule, rollDay, AuthError } from '../api/peloton.js';
import { pickQuestTitle } from '../constants/questTitles.js';
import { pickLoot } from '../constants/loot.js';
import { loadSettings, saveSettings } from './settings.js';

const XP_KEY = 'questboard.progress';
const WEEK_KEY = 'questboard.week';
const XP_PER_LEVEL = 100;
const WEEKLY_BONUS = 25;

// Monotonic week number (weeks since the Unix epoch's Monday). Used to stamp
// quest titles for the "no repeats in 4 weeks" rule.
function currentWeekStamp(now = new Date()) {
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / (7 * 24 * 60 * 60 * 1000));
}

function levelFor(totalXp) {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

// Minutes that count toward XP for a completed day: main class + paired stretch.
function dayMinutes(day) {
  return (day.duration || 0) + (day.stretchDuration || 0);
}

const ScheduleContext = createContext(null);

export function ScheduleProvider({ children }) {
  const weekStamp = currentWeekStamp();

  const [schedule, setSchedule] = useState(() => loadJSON(WEEK_KEY, []));
  const [progress, setProgress] = useState(() =>
    loadJSON(XP_KEY, { totalXp: 0, level: 1, weeklyLog: [] })
  );
  const [settings, setSettings] = useState(loadSettings);
  const [loading, setLoading] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => saveJSON(WEEK_KEY, schedule), [schedule]);
  useEffect(() => saveJSON(XP_KEY, progress), [progress]);
  useEffect(() => saveSettings(settings), [settings]);

  // Refs so async callbacks always read the latest schedule/settings without
  // being re-created on every change.
  const scheduleRef = useRef(schedule);
  const settingsRef = useRef(settings);
  useEffect(() => { scheduleRef.current = schedule; }, [schedule]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const updateSettings = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);

  // Attach a fresh quest title (per type, avoiding recent repeats) to each day.
  const titleize = useCallback(
    (days) => days.map((d) => ({ ...d, questTitle: pickQuestTitle(d.type, weekStamp) })),
    [weekStamp]
  );

  // The action that hit an AuthError, stashed so it can be replayed after login.
  const pendingRef = useRef(null);
  // True while replaying after login — a recurring AuthError then surfaces an
  // error instead of re-opening the login modal (avoids an infinite loop).
  const retryingRef = useRef(false);

  const handleAuthError = useCallback((pending) => {
    if (retryingRef.current) {
      retryingRef.current = false;
      setError('Signed in, but Peloton rejected the request. Your session may be invalid — try signing in again.');
    } else {
      pendingRef.current = pending;
      setNeedsAuth(true);
    }
  }, []);

  // Generate a fresh week from the saved settings (the one-tap primary action).
  const planWeek = useCallback(async () => {
    setError(null);
    setNeedsAuth(false);
    const s = settingsRef.current;
    const skeleton = titleize(buildWeek(s));
    setSchedule(skeleton); // show the shape right away
    setLoading(true);
    try {
      const filled = await fillSchedule(skeleton, s);
      setSchedule(titleize(filled));
      retryingRef.current = false;
    } catch (err) {
      if (err instanceof AuthError) handleAuthError({ kind: 'plan', args: [] });
      else setError(err.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [titleize, handleAuthError]);

  // Fetch a fresh class for one day (different from the current one) and
  // re-pair its stretch. `overrides` can narrow the search (e.g. the
  // "make it easier" hatch).
  const rerollDay = useCallback(async (index, overrides = {}) => {
    setError(null);
    const day = scheduleRef.current[index];
    if (!day) return;
    try {
      const { type, focus, main, stretch } = await rollDay(day, settingsRef.current, overrides);
      setSchedule((prev) =>
        prev.map((d, i) =>
          i === index
            ? {
                ...d,
                type,
                focus: type === 'strength' ? focus : null,
                classId: main?.id ?? null,
                name: main?.title ?? null,
                instructor: main?.instructor ?? null,
                duration: main?.duration ?? null,
                stretchClassId: stretch?.id ?? null,
                stretchName: stretch?.title ?? null,
                stretchDuration: stretch?.duration ?? null,
                questTitle: type === d.type ? d.questTitle : pickQuestTitle(type, weekStamp),
              }
            : d
        )
      );
      retryingRef.current = false;
    } catch (err) {
      if (err instanceof AuthError) handleAuthError({ kind: 'reroll', args: [index, overrides] });
      else setError(err.message || 'Re-roll failed');
    }
  }, [weekStamp, handleAuthError]);

  // Escape hatch: swap this day's class for an easier one (same focus, so the
  // stretch still pairs). 'beginner' biases selection toward the easier half.
  const makeEasier = useCallback(
    (index) => rerollDay(index, { difficulty: 'beginner' }),
    [rerollDay]
  );

  // Escape hatch: turn this day into a guilt-free rest day.
  const skipDay = useCallback((index) => {
    setSchedule((prev) =>
      prev.map((d, i) =>
        i === index
          ? { ...d, type: 'rest', focus: null, boss: false, classId: null, name: null, instructor: null, duration: null, stretchClassId: null, stretchName: null, stretchDuration: null, loot: null, questTitle: pickQuestTitle('rest', weekStamp) }
          : d
      )
    );
  }, [weekStamp]);

  // Replay the action that triggered login, after a successful sign-in.
  const retryPending = useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (!pending) return;
    retryingRef.current = true;
    if (pending.kind === 'plan') planWeek();
    else if (pending.kind === 'reroll') rerollDay(...pending.args);
  }, [planWeek, rerollDay]);

  // Toggle a day done/undone and reconcile XP. XP only ever rises across the
  // session except for undoing a same-session completion; it's never reset.
  const toggleDone = useCallback((index) => {
    setSchedule((prev) => {
      const day = prev[index];
      if (!day || day.type === 'rest') return prev;
      const nowDone = day.status !== 'done';
      // Drop loot on completion (a treasure for the map); clear it on undo.
      // Prefer an item not already on the board this week.
      const usedLoot = prev.map((d) => d.loot).filter(Boolean);
      const loot = nowDone ? pickLoot(day.boss ? 'boss' : day.type, usedLoot) : null;
      const next = prev.map((d, i) =>
        i === index ? { ...d, status: nowDone ? 'done' : 'upcoming', loot } : d
      );

      const delta = dayMinutes(day) * (nowDone ? 1 : -1);
      const allActiveDone = next.filter((d) => d.type !== 'rest').every((d) => d.status === 'done');
      const hadBonus = prev.filter((d) => d.type !== 'rest').every((d) => d.status === 'done');
      const bonusDelta = allActiveDone && !hadBonus ? WEEKLY_BONUS : !allActiveDone && hadBonus ? -WEEKLY_BONUS : 0;

      setProgress((p) => {
        const totalXp = Math.max(0, p.totalXp + delta + bonusDelta);
        return { ...p, totalXp, level: levelFor(totalXp) };
      });
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      schedule,
      progress,
      settings,
      weekStamp,
      loading,
      needsAuth,
      error,
      setNeedsAuth,
      updateSettings,
      planWeek,
      rerollDay,
      makeEasier,
      skipDay,
      toggleDone,
      retryPending,
    }),
    [schedule, progress, settings, weekStamp, loading, needsAuth, error, updateSettings, planWeek, rerollDay, makeEasier, skipDay, toggleDone, retryPending]
  );

  // createElement (not JSX) so this file can keep the .js extension per CLAUDE.md
  // — esbuild's build step won't parse JSX in .js. The disable is a false
  // positive: `value` carries functions, not the refs themselves.
  // eslint-disable-next-line react-hooks/refs
  return createElement(ScheduleContext.Provider, { value }, children);
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('useSchedule must be used within a ScheduleProvider');
  return ctx;
}
