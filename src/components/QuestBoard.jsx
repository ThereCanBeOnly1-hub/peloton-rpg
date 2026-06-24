// Main board view: the winding path with day tiles, the character header with
// XP/level, and the entry points to the Plan / Day / Portrait modals.
import { useState } from 'react';
import { User, Map, Settings } from 'lucide-react';
import DayTile from './DayTile.jsx';
import DayModal from './DayModal.jsx';
import SettingsModal from './SettingsModal.jsx';
import PortraitModal from './PortraitModal.jsx';
import { SwordIcon, WheelIcon, TorchIcon, SprigIcon, CrestIcon } from './icons/index.js';
import { COLORS } from '../constants/colors.js';
import { FONT_DISPLAY, FONT_HEADING, FONT_MONO } from '../constants/fonts.js';
import { TILTS } from '../constants/tilts.js';
import { useSchedule } from '../state/useSchedule.js';

// Fixed tile anchor points within the 400×1000 board viewBox — a gentle zigzag.
const POS = [
  { x: 110, y: 90 }, { x: 290, y: 230 }, { x: 110, y: 370 }, { x: 290, y: 510 },
  { x: 110, y: 650 }, { x: 290, y: 790 }, { x: 110, y: 930 },
];

// A small SVG noise tile, baked once and tiled by the browser as a background
// image — far cheaper than a live, full-area feTurbulence filter.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Smooth S-curve through the anchor points for the dashed bronze trail.
function buildPath(points) {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1], p1 = points[i], midY = (p0.y + p1.y) / 2;
    d += ` C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export default function QuestBoard() {
  const { schedule, progress, loading, planWeek, rerollDay, makeEasier, skipDay, toggleDone } = useSchedule();
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showPortrait, setShowPortrait] = useState(false);

  const pathD = buildPath(POS);
  const activeDays = schedule.filter((d) => d.type !== 'rest');
  const doneActive = activeDays.filter((d) => d.status === 'done').length;
  const xpIntoLevel = progress.totalXp % 100;

  const selectedDay = selectedIndex != null ? schedule[selectedIndex] : null;
  const openDay = (i) => setSelectedIndex(i);
  const closeDay = () => setSelectedIndex(null);

  return (
    <div className="w-full flex justify-center px-4 py-8" style={{ background: COLORS.bg, fontFamily: FONT_DISPLAY, minHeight: '100vh', position: 'relative' }}>
      <style>{`
        @keyframes bob { 0%,100%{transform:translateX(-50%) translateY(0);}50%{transform:translateX(-50%) translateY(-6px);} }
        @keyframes pulseGlow { 0%,100%{filter:drop-shadow(0 0 0px rgba(217,164,65,0));}50%{filter:drop-shadow(0 0 10px rgba(217,164,65,0.6));} }
        @media(prefers-reduced-motion:reduce){.bob,.pulseGlow{animation:none!important;}}
        .day-tile:focus-visible{filter:drop-shadow(0 0 6px rgba(217,164,65,0.7));}
      `}</style>

      {/* Cheap pre-baked paper grain, fixed behind all content (z-index 0).
          Replaces a live full-area feTurbulence filter, which blacked out
          content via mix-blend and hung the rasterizer. */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: GRAIN, opacity: 0.05, pointerEvents: 'none', zIndex: 0 }} />

      {/* Off-screen SVG defs: the two tile clip shapes used by DayTile. */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <clipPath id="sealBlob" clipPathUnits="objectBoundingBox"><path d="M0.50,0.05 C0.70,0.05 0.90,0.20 0.92,0.45 C0.94,0.68 0.78,0.90 0.52,0.93 C0.28,0.96 0.08,0.78 0.06,0.52 C0.04,0.28 0.22,0.08 0.50,0.05 Z" /></clipPath>
          <clipPath id="shieldBlob" clipPathUnits="objectBoundingBox"><path d="M0.50,0.02 L0.92,0.12 C0.94,0.40 0.90,0.62 0.74,0.80 C0.64,0.90 0.56,0.96 0.50,0.99 C0.44,0.96 0.36,0.90 0.26,0.80 C0.10,0.62 0.06,0.40 0.08,0.12 Z" /></clipPath>
        </defs>
      </svg>
      <div className="w-full" style={{ maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Header: portrait + level, week title, XP bar */}
        <div className="flex items-start gap-4 mb-5">
          <button onClick={() => setShowPortrait(true)} aria-label="View portrait" style={{ position: 'relative', flexShrink: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <div style={{ width: 62, height: 62, borderRadius: '50%', background: COLORS.stone, border: `3px solid ${COLORS.iron}`, boxShadow: `0 0 0 3px ${COLORS.bronze}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={26} color={COLORS.parchmentDim} />
            </div>
            <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', background: COLORS.gold, color: COLORS.ink, fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, border: `2px solid ${COLORS.bg}` }}>
              LV {progress.level}
            </div>
          </button>
          <div className="flex-1 pt-1">
            <div className="uppercase mb-1" style={{ fontFamily: FONT_HEADING, color: COLORS.gold, letterSpacing: '0.2em', fontSize: 10 }}>Quest Board</div>
            <h1 className="text-3xl" style={{ fontFamily: FONT_DISPLAY, color: COLORS.parchment, fontWeight: 400 }}>This Week</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: COLORS.stone, border: `1px solid ${COLORS.iron}` }}>
                <div className="h-full rounded-full" style={{ width: `${xpIntoLevel}%`, background: COLORS.gold }} />
              </div>
              <div style={{ fontFamily: FONT_MONO, color: COLORS.parchmentDim, fontSize: 11 }}>
                {doneActive}/{activeDays.length || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8">
          <button onClick={() => planWeek()} disabled={loading} className="flex-1 flex items-center justify-center gap-2" style={{ background: COLORS.stone, color: COLORS.parchment, border: `2px solid ${COLORS.bronze}`, borderRadius: 4, padding: '11px 14px', fontFamily: FONT_HEADING, fontSize: 13, letterSpacing: '0.04em', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            <Map size={15} color={COLORS.gold} /> {loading ? 'Consulting the Map…' : 'New Week'}
          </button>
          <button onClick={() => setSettingsOpen(true)} aria-label="Settings" style={{ flexShrink: 0, background: COLORS.stone, color: COLORS.parchment, border: `2px solid ${COLORS.bronze}`, borderRadius: 4, padding: '11px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Settings size={16} color={COLORS.gold} />
          </button>
        </div>

        {/* Board */}
        {schedule.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.parchmentDim, fontFamily: FONT_HEADING, fontSize: 14, lineHeight: 1.6 }}>
            No quest awaits. Tap <em>New Week</em> to chart your path.
          </div>
        ) : (
          <div className="relative" style={{ aspectRatio: '400 / 1000' }}>
            <svg viewBox="0 0 400 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0 }}>
              <path d={pathD} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="9" strokeLinecap="round" transform="translate(0,3)" />
              <path d={pathD} fill="none" stroke={COLORS.bronze} strokeWidth="5" strokeLinecap="round" strokeDasharray="1 16" opacity="0.8" />
            </svg>
            {schedule.map((day, i) => (
              <DayTile key={day.day} day={day} pos={POS[i]} tilt={TILTS[i]} onOpen={() => openDay(i)} />
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-10 flex-wrap" style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.parchmentDim }}>
          <div className="flex items-center gap-1"><SwordIcon size={13} color={COLORS.parchmentDim} /> Strength</div>
          <div className="flex items-center gap-1"><WheelIcon size={13} color={COLORS.parchmentDim} /> Cycle</div>
          <div className="flex items-center gap-1"><SprigIcon size={13} color={COLORS.parchmentDim} /> Stretch</div>
          <div className="flex items-center gap-1"><TorchIcon size={13} color={COLORS.parchmentDim} /> Rest</div>
          <div className="flex items-center gap-1"><CrestIcon size={13} color={COLORS.gold} /> Boss</div>
        </div>
      </div>

      {selectedDay && (
        <DayModal
          day={selectedDay}
          index={selectedIndex}
          onClose={closeDay}
          onToggleDone={toggleDone}
          onReroll={rerollDay}
          onMakeEasier={makeEasier}
          onSkip={skipDay}
        />
      )}
      {showPortrait && <PortraitModal onClose={() => setShowPortrait(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
