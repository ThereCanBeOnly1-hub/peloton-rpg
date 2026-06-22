// Per-day re-roll with scoped filters. Lets you change the class type, focus,
// instructor, and max length for a single day, then fetch a fresh class.
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Modal from './Modal.jsx';
import Stepper from './Stepper.jsx';
import { COLORS } from '../constants/colors.js';
import { FONT_HEADING, FONT_MONO } from '../constants/fonts.js';
import { TYPE_META } from '../constants/classTypes.js';
import { STRENGTH_FOCUS } from '../engine/balance.js';

const chip = (active) => ({
  padding: '5px 9px', fontFamily: FONT_MONO, fontSize: 11,
  border: `1px solid ${COLORS.bronze}`, borderRadius: 12, cursor: 'pointer',
  background: active ? COLORS.crimson : 'transparent',
  color: active ? COLORS.parchment : COLORS.ink,
});

const section = { marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${COLORS.bronze}55` };
const sectionLabel = { fontSize: 12, color: COLORS.bronze, fontFamily: FONT_MONO, marginBottom: 6 };

export default function RerollModal({ day, instructors = [], onClose, onConfirm }) {
  const [type, setType] = useState(day.type === 'rest' ? 'rest' : day.type);
  const [focus, setFocus] = useState(day.focus || 'Full Body');
  const [instructorId, setInstructorId] = useState('');
  const [duration, setDuration] = useState(day.duration || 20);

  return (
    <Modal title={`Re-roll ${day.day}`} onClose={onClose}>
      <h2 style={{ fontFamily: FONT_HEADING, fontSize: 16, margin: '4px 0 10px' }}>Find a Different Class</h2>

      <div style={section}>
        <div style={sectionLabel}>Class Type</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.entries(TYPE_META).map(([key, meta]) => (
            <button key={key} onClick={() => setType(key)} style={{ flex: 1, padding: '6px 0', fontFamily: FONT_MONO, fontSize: 12, border: `1px solid ${COLORS.bronze}`, borderRadius: 4, cursor: 'pointer', background: type === key ? COLORS.crimson : 'transparent', color: type === key ? COLORS.parchment : COLORS.ink }}>
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      {type === 'strength' && (
        <div style={section}>
          <div style={sectionLabel}>Focus Area</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {STRENGTH_FOCUS.map((f) => (
              <button key={f} onClick={() => setFocus(f)} style={chip(focus === f)}>{f}</button>
            ))}
          </div>
        </div>
      )}

      {type !== 'rest' && (
        <>
          {instructors.length > 0 && (
            <div style={section}>
              <div style={sectionLabel}>Instructor <span style={{ opacity: 0.6 }}>(optional)</span></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {instructors.map((ins) => (
                  <button key={ins.id} onClick={() => setInstructorId(instructorId === ins.id ? '' : ins.id)} style={chip(instructorId === ins.id)}>
                    {ins.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Stepper label="Max minutes" value={duration} onChange={setDuration} min={5} max={60} />
        </>
      )}

      <button
        onClick={() => { onConfirm({ type, focus, instructorId: instructorId || undefined, maxDuration: duration }); onClose(); }}
        style={{ width: '100%', marginTop: 14, background: COLORS.moss, color: COLORS.parchment, border: 'none', padding: 10, borderRadius: 4, fontFamily: FONT_HEADING, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <RefreshCw size={13} /> Roll New Class
      </button>
    </Modal>
  );
}
