// A single day tile on the winding path: seal-blob for normal days, heraldic
// shield for the boss. Slightly rotated to look hand-stamped; the icon
// counter-rotates to stay upright. Badges: stretch sprig, done check, today
// footsteps, boss crown.
import { Check, Footprints } from 'lucide-react';
import { SwordIcon, WheelIcon, TorchIcon, SprigIcon, CrestIcon } from './icons/index.js';
import { COLORS } from '../constants/colors.js';
import { FONT_HEADING, FONT_MONO } from '../constants/fonts.js';

const ICONS = { strength: SwordIcon, cycle: WheelIcon, rest: TorchIcon };

export default function DayTile({ day, pos, tilt, onOpen }) {
  const isRest = day.type === 'rest';
  const isBoss = !!day.boss;
  const isToday = day.status === 'today';
  const isDone = day.status === 'done';
  const paired = day.type !== 'rest';
  const Icon = ICONS[day.type];

  const baseSize = isBoss ? 88 : isRest ? 54 : 68;
  const tileBg = isBoss ? COLORS.crimson : isRest ? COLORS.stone : COLORS.parchment;
  const iconColor = isBoss ? COLORS.parchment : isRest ? COLORS.moss : COLORS.ink;
  const clip = isBoss ? 'url(#shieldBlob)' : 'url(#sealBlob)';

  const left = `${(pos.x / 400) * 100}%`;
  const top = `${(pos.y / 1000) * 100}%`;

  const open = () => onOpen(day);

  return (
    <div style={{ position: 'absolute', left, top, transform: 'translate(-50%,-50%)', width: 100, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: baseSize, height: baseSize }}>
        {isToday && (
          <div className="bob" style={{ position: 'absolute', left: '50%', top: -26, transform: 'translateX(-50%)', animation: 'bob 1.6s ease-in-out infinite' }}>
            <Footprints size={20} color={COLORS.gold} />
          </div>
        )}
        {isBoss && (
          <div style={{ position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)' }}>
            <CrestIcon size={20} color={COLORS.gold} />
          </div>
        )}

        <div
          role="button"
          tabIndex={0}
          onClick={open}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }}
          className={`day-tile${isBoss ? ' pulseGlow' : ''}`}
          style={{
            width: baseSize, height: baseSize, clipPath: clip, background: tileBg,
            border: `3px solid ${isToday ? COLORS.gold : COLORS.iron}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            outline: 'none', transform: `rotate(${tilt}deg)`,
            filter: isToday ? 'drop-shadow(0 0 6px rgba(217,164,65,0.55))' : 'none',
            animation: isBoss ? 'pulseGlow 2.4s ease-in-out infinite' : 'none',
            opacity: day.status === 'upcoming' ? 0.88 : 1,
          }}
        >
          <div style={{ transform: `rotate(${-tilt}deg)` }}>
            <Icon size={isBoss ? 30 : isRest ? 21 : 25} color={iconColor} />
          </div>
        </div>

        {paired && (
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%', background: COLORS.moss, border: `2px solid ${COLORS.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SprigIcon size={12} color={COLORS.parchment} />
          </div>
        )}
        {isDone && (
          <div style={{ position: 'absolute', top: -4, left: -4, width: 22, height: 22, borderRadius: '50%', background: COLORS.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${COLORS.bg}` }}>
            <Check size={12} color={COLORS.ink} />
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 9 }}>
        <div style={{ fontFamily: FONT_MONO, color: COLORS.parchmentDim, fontSize: 10, letterSpacing: '0.1em' }}>{day.day}</div>
        <div style={{ fontFamily: FONT_HEADING, color: COLORS.parchment, fontSize: isBoss ? 13.5 : 12, fontWeight: 600, lineHeight: 1.25, marginTop: 2 }}>
          {day.questTitle}
        </div>
      </div>
    </div>
  );
}
