// A labelled +/- stepper row, used throughout the Plan and Re-roll modals.
import { COLORS } from '../constants/colors.js';
import { FONT_MONO } from '../constants/fonts.js';

export default function Stepper({ label, value, onChange, min = 0, max = 99 }) {
  const btn = {
    width: 22, height: 22, borderRadius: 4, border: `1px solid ${COLORS.bronze}`,
    background: 'transparent', color: COLORS.bronze, fontSize: 14, cursor: 'pointer',
  };
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${COLORS.bronze}55` }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => onChange(Math.max(min, value - 1))} style={btn}>&minus;</button>
        <span style={{ fontFamily: FONT_MONO, fontSize: 13, width: 18, textAlign: 'center' }}>{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} style={btn}>+</button>
      </div>
    </div>
  );
}
