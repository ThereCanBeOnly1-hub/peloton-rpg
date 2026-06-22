// Schedule + progression state for the current week. Holds the 7-day schedule,
// XP/level, and the actions the UI dispatches (plan, edit, reroll, mark done).
// XP and the active week persist in localStorage; see CLAUDE.md "XP & Leveling".
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buildWeek } from '../engine/balance.js';
import { fillSchedule, getClasses, AuthError } from '../api/peloton.js';
import { pickQuestTitle } from '../constants/questTitles.js';

const XP_KEY = 'questboard.progress';
const WEEK_KEY = 'questboard.week';
const XP_PER_LEVEL = 100;
const WEEKLY_BONUS = 25;

// Monotonic week number (weeks since the Unix epoch's Monday). Used to stamp
// quest titles for the "no repeats in 4 weeks" rule and to label the board.
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
  const [loading, setLoading] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => saveJSON(WEEK_KEY, schedule), [schedule]);
  useEffect(() => saveJSON(XP_KEY, progress), [progress]);

  // Attach a fresh quest title (per type, avoiding recent repeats) to each day.
  const titleize = useCallback(
    (days) => days.map((d) => ({ ...d, questTitle: pickQuestTitle(d.type, weekStamp) })),
    [weekStamp]
  );

  // Plan a new week: build the skeleton instantly, then fill it from Peloton.
  const planWeek = useCallback(
    async (prefs) => {
      setError(null);
      setNeedsAuth(false);
      const skeleton = titleize(buildWeek(prefs));
      setSchedule(skeleton); // show the shape right away
      setLoading(true);
      try {
        const filled = await fillSchedule(skeleton, prefs);
        setSchedule(titleize(filled));
      } catch (err) {
        if (err instanceof AuthError) setNeedsAuth(true);
        else setError(err.message || 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    },
    [titleize]
  );

  const updateDayType = useCallback((index, type) => {
    setSchedule((prev) =>
      prev.map((d, i) =>
        i === index
          ? { ...d, type, focus: type === 'strength' ? d.focus || 'Full Body' : null, questTitle: pickQuestTitle(type, weekStamp) }
          : d
      )
    );
  }, [weekStamp]);

  const moveDay = useCallback((index, dir) => {
    setSchedule((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      // Swap the activity between the two slots, but keep each slot's weekday
      // label and status (done/today/upcoming) fixed to its calendar position.
      const next = [...prev];
      const swap = (target, source) => ({
        day: target.day,
        status: target.status,
        type: source.type,
        focus: source.focus,
        boss: source.boss,
        questTitle: source.questTitle,
        classId: source.classId,
        name: source.name,
        instructor: source.instructor,
        duration: source.duration,
        stretchClassId: source.stretchClassId,
        stretchName: source.stretchName,
        stretchDuration: source.stretchDuration,
      });
      next[index] = swap(prev[index], prev[j]);
      next[j] = swap(prev[j], prev[index]);
      return next;
    });
  }, []);

  // Re-roll one day with scoped filters — fetches a fresh class for that slot.
  const rerollDay = useCallback(
    async (index, { type, focus, instructorId, maxDuration }) => {
      setError(null);
      const discipline = type === 'cycle' ? 'cycling' : 'strength';
      try {
        const classes = await getClasses({ discipline, instructorId, maxDuration });
        const main = classes[0] || null;
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
                  questTitle: pickQuestTitle(type, weekStamp),
                }
              : d
          )
        );
      } catch (err) {
        if (err instanceof AuthError) setNeedsAuth(true);
        else setError(err.message || 'Re-roll failed');
      }
    },
    [weekStamp]
  );

  // Toggle a day done/undone and reconcile XP. XP only ever rises across the
  // session except for undoing a same-session completion; it's never reset.
  const toggleDone = useCallback((index) => {
    setSchedule((prev) => {
      const day = prev[index];
      if (!day || day.type === 'rest') return prev;
      const nowDone = day.status !== 'done';
      const next = prev.map((d, i) => (i === index ? { ...d, status: nowDone ? 'done' : 'upcoming' } : d));

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
      weekStamp,
      loading,
      needsAuth,
      error,
      setNeedsAuth,
      planWeek,
      updateDayType,
      moveDay,
      rerollDay,
      toggleDone,
    }),
    [schedule, progress, weekStamp, loading, needsAuth, error, planWeek, updateDayType, moveDay, rerollDay, toggleDone]
  );

  return createElement(ScheduleContext.Provider, { value }, children);
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('useSchedule must be used within a ScheduleProvider');
  return ctx;
}
