// Main board view: the winding path with day tiles, the character header with
// XP/level, and the entry points to the Plan / Day / Portrait modals.
import { useState } from 'react';
import { User, Map, Settings } from 'lucide-react';
import DayTile from './DayTile.jsx';
import DayModal from './DayModal.jsx';
import SettingsModal from './SettingsModal.jsx';
import PortraitModal from './PortraitModal.jsx';
import { SwordIcon, WheelIcon, CampfireIcon, SprigIcon, CastleIcon } from './icons/index.js';
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
  const { schedule, progress, settings, loading, planWeek, rerollDay, makeEasier, skipDay, toggleDone } = useSchedule();
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

  // Marking a day done closes the modal so the seal stamp + loot drop are visible
  // on the board. (Undo keeps the modal open.)
  const handleToggleDone = (i) => {
    const wasDone = schedule[i]?.status === 'done';
    toggleDone(i);
    if (!wasDone) closeDay();
  };

  return (
    <div className="w-full flex justify-center px-4 py-8" style={{ background: COLORS.bg, fontFamily: FONT_DISPLAY, minHeight: '100vh', position: 'relative' }}>
      <style>{`
        @keyframes qbTodayPulse { 0%,100%{box-shadow:0 0 0 2px #D9A441, 0 0 8px 2px rgba(217,164,65,.25);}50%{box-shadow:0 0 0 2px #D9A441, 0 0 16px 5px rgba(217,164,65,.55);} }
        @keyframes qbLootPop { 0%{transform:translateY(-14px) scale(.2) rotate(-18deg);opacity:0;}70%{transform:translateY(0) scale(1.2) rotate(6deg);opacity:1;}100%{transform:scale(1) rotate(0);opacity:1;} }
        @keyframes qbStamp { 0%{transform:translate(-50%,-50%) scale(2.4) rotate(-20deg);opacity:0;}70%{transform:translate(-50%,-50%) scale(.9) rotate(6deg);opacity:1;}100%{transform:translate(-50%,-50%) scale(1) rotate(0);opacity:1;} }
        .qb-today{animation:qbTodayPulse 1.9s ease-in-out infinite;}
        .qb-loot{animation:qbLootPop .56s cubic-bezier(.2,1.4,.4,1) both;}
        .qb-stamp{animation:qbStamp .5s cubic-bezier(.2,1.3,.4,1) both;}
        @media(prefers-reduced-motion:reduce){.qb-today,.qb-loot,.qb-stamp{animation:none!important;}}
      `}</style>

      {/* Cheap pre-baked paper grain on the dark dungeon backdrop. */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: GRAIN, opacity: 0.05, pointerEvents: 'none', zIndex: 0 }} />

      <div className="w-full" style={{ maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Header: portrait + level, week title, XP bar */}
        <div className="flex items-start gap-4 mb-5">
          <button onClick={() => setShowPortrait(true)} aria-label="View portrait" style={{ position: 'relative', flexShrink: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <div style={{ width: 62, height: 62, borderRadius: '50%', overflow: 'hidden', background: COLORS.stone, border: `3px solid ${COLORS.iron}`, boxShadow: `0 0 0 3px ${COLORS.bronze}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {settings.avatar ? (
                <img src={settings.avatar} alt="Portrait" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={26} color={COLORS.parchmentDim} />
              )}
            </div>
            <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', background: COLORS.gold, color: COLORS.ink, fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, border: `2px solid ${COLORS.bg}` }}>
              LV {progress.level}
            </div>
          </button>
          <div className="flex-1 pt-1">
            <div className="uppercase mb-1" style={{ fontFamily: FONT_HEADING, color: COLORS.gold, letterSpacing: '0.2em', fontSize: 10 }}>Peloton RPG</div>
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
          <div className="relative" style={{ aspectRatio: '400 / 1000', background: COLORS.parchment, border: `3px double ${COLORS.bronze}`, outline: `1px solid ${COLORS.iron}`, borderRadius: 6, overflow: 'hidden' }}>
            <svg viewBox="0 0 400 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0 }}>
              <defs>
                <pattern id="qbgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M40 0 H0 V40" fill="none" stroke={COLORS.bronze} strokeWidth="0.8" opacity="0.22" />
                </pattern>
              </defs>
              <rect width="400" height="1000" fill="url(#qbgrid)" />
              <rect x="6" y="6" width="388" height="988" fill="none" stroke={COLORS.bronze} strokeWidth="1.5" opacity="0.5" />
              {/* Inked wandering route between the quest markers */}
              <path d={pathD} fill="none" stroke="#4a3520" strokeWidth="3" strokeLinecap="round" strokeDasharray="1.5 13" opacity="0.8" />
              {/* Light terrain marginalia */}
              <g stroke="#5b7a55" fill="#5b7a55" opacity="0.7">
                <path d="M330,300 l6,-18 l6,18 z" /><rect x="333" y="300" width="5" height="8" />
                <path d="M60,560 l6,-18 l6,18 z" /><rect x="63" y="560" width="5" height="8" />
                <path d="M320,720 l6,-18 l6,18 z" /><rect x="323" y="720" width="5" height="8" />
              </g>
              <g stroke={COLORS.bronze} fill="none" strokeWidth="1.5" opacity="0.5" strokeLinecap="round">
                <path d="M55,250 q18,-24 36,0" /><path d="M78,250 q13,-17 26,0" />
                <path d="M300,840 q18,-24 36,0" />
              </g>
              {/* Compass rose */}
              <g transform="translate(350,70)" stroke={COLORS.bronze} fill={COLORS.bronze} opacity="0.6">
                <circle r="16" fill="none" strokeWidth="1.2" />
                <path d="M0,-16 L3.4,0 L0,16 L-3.4,0 Z M-16,0 L0,3.4 L16,0 L0,-3.4 Z" />
              </g>
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
          <div className="flex items-center gap-1"><CampfireIcon size={14} /> Rest</div>
          <div className="flex items-center gap-1"><CastleIcon size={18} /> Boss</div>
        </div>
      </div>

      {selectedDay && (
        <DayModal
          day={selectedDay}
          index={selectedIndex}
          onClose={closeDay}
          onToggleDone={handleToggleDone}
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
