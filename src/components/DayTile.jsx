// A single quest marker on the battle map: a wax seal (crimson strength, bronze
// cycle), a campfire for rest, or the castle keep for the boss. Slightly tilted
// to look hand-stamped. Shows a done stamp, today glow, stretch badge, and any
// loot dropped when the day was cleared.
import { Check } from 'lucide-react';
import { SwordIcon, WheelIcon, CampfireIcon, SprigIcon, CastleIcon, LootIcon } from './icons/index.js';
import { COLORS } from '../constants/colors.js';
import { FONT_HEADING } from '../constants/fonts.js';

const ICONS = { strength: SwordIcon, cycle: WheelIcon };

export default function DayTile({ day, pos, tilt, onOpen }) {
  const isRest = day.type === 'rest';
  const isBoss = !!day.boss;
  const isToday = day.status === 'today';
  const isDone = day.status === 'done';
  const paired = !isRest;

  const left = `${(pos.x / 400) * 100}%`;
  const top = `${(pos.y / 1000) * 100}%`;

  // Seal styling per type.
  const size = isRest ? 46 : 56;
  const sealBg = day.type === 'strength' ? COLORS.crimson : day.type === 'cycle' ? COLORS.bronze : COLORS.iron;
  const Icon = ICONS[day.type];

  const open = () => onOpen(day);
  const labelColor = isBoss ? COLORS.crimson : COLORS.ink;

  const stamp = isDone && (
    <span className="qb-stamp" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 30, height: 30, borderRadius: '50%', background: COLORS.gold, border: '2px solid #b9892f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a2a08', zIndex: 3 }}>
      <Check size={18} />
    </span>
  );

  const loot = day.loot && (
    <div className="qb-loot" style={{ position: 'absolute', right: -20, bottom: -10, zIndex: 4, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.35))' }}>
      <LootIcon id={day.loot} size={isBoss ? 30 : 26} />
    </div>
  );

  return (
    <div style={{ position: 'absolute', left, top, transform: 'translate(-50%,-50%)', width: 108, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative' }}>
        {isBoss ? (
          <button onClick={open} aria-label={`${day.day} boss`} style={{ position: 'relative', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block' }}>
            <CastleIcon size={68} />
            {stamp}
            {loot}
          </button>
        ) : (
          <button
            onClick={open}
            aria-label={day.day}
            className={isToday ? 'qb-today' : undefined}
            style={{ position: 'relative', width: size, height: size, borderRadius: '50%', background: sealBg, border: `3px solid ${isToday ? COLORS.gold : COLORS.bronze}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${tilt}deg)`, padding: 0 }}
          >
            <span style={{ transform: `rotate(${-tilt}deg)`, display: 'flex' }}>
              {isRest ? <CampfireIcon size={24} /> : <Icon size={24} color={COLORS.parchment} />}
            </span>
            {paired && (
              <span style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: COLORS.moss, border: `2px solid ${COLORS.parchment}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SprigIcon size={11} color={COLORS.parchment} />
              </span>
            )}
            {stamp}
            {loot}
          </button>
        )}
      </div>
      <div style={{ textAlign: 'center', marginTop: 6 }}>
        <div style={{ fontFamily: FONT_HEADING, color: '#5b4327', fontSize: 11, letterSpacing: '0.08em' }}>
          {day.day}{isBoss ? ' · BOSS' : isToday ? ' · TODAY' : ''}
        </div>
        <div style={{ fontFamily: FONT_HEADING, color: labelColor, fontSize: 11, fontWeight: 600, lineHeight: 1.25, marginTop: 1 }}>
          {day.questTitle}
        </div>
      </div>
    </div>
  );
}
