// Set-once preferences. Everything here applies automatically to every "New
// Week", so the daily flow needs no input. Editable any time, required never.
import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import Stepper from './Stepper.jsx';
import InstructorPicker from './InstructorPicker.jsx';
import { COLORS } from '../constants/colors.js';
import { FONT_HEADING, FONT_MONO } from '../constants/fonts.js';
import { DIFFICULTY_LEVELS } from '../constants/difficulty.js';
import { WEEKDAYS } from '../engine/balance.js';
import { TYPE_META } from '../constants/classTypes.js';
import { useSchedule } from '../state/useSchedule.js';
import { getInstructors } from '../api/peloton.js';

const sectionLabel = { fontFamily: FONT_HEADING, fontSize: 12, letterSpacing: '0.08em', color: COLORS.bronze, textTransform: 'uppercase', margin: '16px 0 8px' };

export default function SettingsModal({ onClose }) {
  const { settings, updateSettings } = useSchedule();
  const [instructors, setInstructors] = useState([]);

  useEffect(() => {
    getInstructors().then(setInstructors).catch(() => setInstructors([]));
  }, []);

  const setTemplateDay = (index, type) =>
    updateSettings({ weekTemplate: settings.weekTemplate.map((t, i) => (i === index ? type : t)) });

  const typeBtn = (active) => ({
    flex: 1, padding: '5px 0', fontFamily: FONT_MONO, fontSize: 11, border: `1px solid ${COLORS.bronze}`,
    borderRadius: 4, cursor: 'pointer', background: active ? COLORS.crimson : 'transparent',
    color: active ? COLORS.parchment : COLORS.ink,
  });

  return (
    <Modal title="Settings" onClose={onClose} wide>
      <p style={{ fontSize: 13, lineHeight: 1.5, color: COLORS.bronze, marginBottom: 4 }}>
        Set these once — every new week uses them automatically.
      </p>

      {/* Preferred week */}
      <div style={sectionLabel}>Preferred Week</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {WEEKDAYS.map((day, i) => (
          <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 38, fontFamily: FONT_MONO, fontSize: 12, color: COLORS.bronze, fontWeight: 700 }}>{day}</span>
            <div style={{ display: 'flex', gap: 5, flex: 1 }}>
              {Object.entries(TYPE_META).map(([key, meta]) => (
                <button key={key} onClick={() => setTemplateDay(i, key)} style={typeBtn(settings.weekTemplate[i] === key)}>
                  {meta.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Difficulty */}
      <div style={sectionLabel}>Difficulty</div>
      <div style={{ display: 'flex', gap: 5 }}>
        {DIFFICULTY_LEVELS.map((lvl) => (
          <button
            key={lvl.id}
            onClick={() => updateSettings({ difficulty: lvl.id })}
            style={{ flex: 1, padding: '7px 0', fontFamily: FONT_MONO, fontSize: 11, border: `1px solid ${COLORS.bronze}`, borderRadius: 4, cursor: 'pointer', background: settings.difficulty === lvl.id ? COLORS.crimson : 'transparent', color: settings.difficulty === lvl.id ? COLORS.parchment : COLORS.ink }}
          >
            {lvl.label}
          </button>
        ))}
      </div>

      {/* Max class length */}
      <div style={sectionLabel}>Max Class Length</div>
      <Stepper label="Minutes" value={settings.maxDuration} onChange={(v) => updateSettings({ maxDuration: v })} min={5} max={60} />

      {/* Instructors */}
      <div style={sectionLabel}>Favorite Instructors</div>
      <InstructorPicker
        instructors={instructors}
        selectedIds={settings.instructorIds}
        onChange={(ids) => updateSettings({ instructorIds: ids })}
      />

      <button
        onClick={onClose}
        style={{ width: '100%', marginTop: 18, background: COLORS.moss, color: COLORS.parchment, border: 'none', padding: 10, borderRadius: 4, fontFamily: FONT_HEADING, fontSize: 13, cursor: 'pointer' }}
      >
        Done
      </button>
    </Modal>
  );
}
