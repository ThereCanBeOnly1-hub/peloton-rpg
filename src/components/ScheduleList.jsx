// Editable Mon–Sun list shown inside PlanModal after a week is generated.
// Swap a day's type, reorder with the arrows, or re-roll an individual class.
import { RefreshCw } from 'lucide-react';
import { COLORS } from '../constants/colors.js';
import { FONT_HEADING, FONT_MONO } from '../constants/fonts.js';
import { TYPE_META } from '../constants/classTypes.js';

export default function ScheduleList({ schedule, onChangeType, onMove, onRerollDay }) {
  return (
    <div style={{ marginTop: 18, paddingTop: 14, borderTop: `2px double ${COLORS.bronze}` }}>
      <div style={{ fontFamily: FONT_HEADING, fontSize: 13, marginBottom: 2 }}>This Week</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.bronze, marginBottom: 10 }}>
        swap type &middot; arrows to reorder &middot; ↺ to re-roll a class
      </div>

      {schedule.map((s, i) => (
        <div key={s.day} style={{ padding: '9px 0', borderBottom: `1px solid ${COLORS.bronze}33` }}>
          {/* Row 1: day + type buttons + reorder arrows */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.type !== 'rest' ? 5 : 0 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: COLORS.bronze, fontWeight: 700, width: 34 }}>{s.day}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {Object.entries(TYPE_META).map(([key, meta]) => (
                <button key={key} onClick={() => onChangeType(i, key)} title={meta.label} style={{ width: 28, height: 24, borderRadius: 4, fontSize: 11, fontFamily: FONT_MONO, cursor: 'pointer', border: `1px solid ${COLORS.bronze}`, background: s.type === key ? COLORS.crimson : 'transparent', color: s.type === key ? COLORS.parchment : COLORS.ink }}>
                  {meta.letter}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button onClick={() => onMove(i, -1)} disabled={i === 0} style={{ width: 20, height: 16, fontSize: 10, border: `1px solid ${COLORS.bronze}`, background: 'transparent', color: i === 0 ? `${COLORS.bronze}44` : COLORS.bronze, cursor: i === 0 ? 'default' : 'pointer', borderRadius: 3 }}>&uarr;</button>
              <button onClick={() => onMove(i, 1)} disabled={i === schedule.length - 1} style={{ width: 20, height: 16, fontSize: 10, border: `1px solid ${COLORS.bronze}`, background: 'transparent', color: i === schedule.length - 1 ? `${COLORS.bronze}44` : COLORS.bronze, cursor: i === schedule.length - 1 ? 'default' : 'pointer', borderRadius: 3 }}>&darr;</button>
            </div>
          </div>

          {/* Row 2: class details + per-day re-roll */}
          {s.type !== 'rest' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 34 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontFamily: FONT_MONO, color: COLORS.bronze, lineHeight: 1.4 }}>
                  {s.name ? `${s.name} · ${s.duration} min · ${s.instructor}` : 'No class assigned'}
                </div>
              </div>
              <button
                onClick={() => onRerollDay(i)}
                title="Re-roll this class"
                style={{ flexShrink: 0, marginLeft: 8, width: 28, height: 28, border: `1px solid ${COLORS.bronze}`, borderRadius: 4, background: 'transparent', color: COLORS.bronze, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <RefreshCw size={13} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
