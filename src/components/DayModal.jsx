// Tap-a-day popup: quest title, the real class + instructor, and a deep link
// out to Peloton. Rest days show flavor text instead.
import { ExternalLink, Check } from 'lucide-react';
import Modal from './Modal.jsx';
import { COLORS } from '../constants/colors.js';
import { FONT_HEADING, FONT_MONO } from '../constants/fonts.js';
import { SUB_LABEL, DISCIPLINE } from '../constants/classTypes.js';
import { classLink } from '../api/peloton.js';

export default function DayModal({ day, onClose, onToggleDone }) {
  const isRest = day.type === 'rest';
  const isDone = day.status === 'done';
  const paired = !isRest && day.stretchName;

  return (
    <Modal title={day.day} onClose={onClose}>
      <h2 style={{ fontFamily: FONT_HEADING, fontSize: 21, margin: '4px 0 2px' }}>{day.questTitle}</h2>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.bronze, marginBottom: 12 }}>
        {SUB_LABEL[day.type]}{paired ? ' + Stretch' : ''}
      </div>

      {!isRest ? (
        <>
          {day.name ? (
            <>
              <div style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 4 }}><em>{day.name}</em></div>
              <div style={{ fontSize: 14, lineHeight: 1.5, marginBottom: paired ? 6 : 14 }}>
                with <strong>{day.instructor}</strong> &middot; {day.duration} min
              </div>
            </>
          ) : (
            <div style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 14, fontStyle: 'italic', color: COLORS.bronze }}>
              No class assigned yet — plan the week or re-roll this day.
            </div>
          )}

          {paired && (
            <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 14, color: COLORS.bronze }}>
              Stretch: <em>{day.stretchName}</em> &middot; {day.stretchDuration} min
            </div>
          )}

          {day.classId && (
            <a
              href={classLink(day.classId, DISCIPLINE[day.type] || 'cycling')}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: COLORS.crimson, color: COLORS.parchment, padding: '10px 14px', borderRadius: 4, fontFamily: FONT_HEADING, fontSize: 13, textDecoration: 'none' }}
            >
              <ExternalLink size={14} /> View on Peloton
            </a>
          )}

          <button
            onClick={() => onToggleDone(day)}
            style={{ width: '100%', marginTop: 10, background: isDone ? 'transparent' : COLORS.moss, color: isDone ? COLORS.bronze : COLORS.parchment, border: `1px solid ${isDone ? COLORS.bronze : 'transparent'}`, padding: 10, borderRadius: 4, fontFamily: FONT_HEADING, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Check size={14} /> {isDone ? 'Mark Not Done' : 'Mark Complete'}
          </button>
        </>
      ) : (
        <div style={{ fontSize: 15, lineHeight: 1.5 }}>A day to recover. No quest awaits &mdash; rest your blade.</div>
      )}
    </Modal>
  );
}
