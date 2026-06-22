// "Plan the Week" modal — set this week's criteria, generate via the balance
// engine + Peloton fetch, then fine-tune the result in the embedded list.
import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import Stepper from './Stepper.jsx';
import ScheduleList from './ScheduleList.jsx';
import RerollModal from './RerollModal.jsx';
import { COLORS } from '../constants/colors.js';
import { FONT_HEADING, FONT_MONO } from '../constants/fonts.js';
import { useSchedule } from '../state/useSchedule.js';
import { getInstructors } from '../api/peloton.js';

export default function PlanModal({ onClose }) {
  const { schedule, loading, error, planWeek, updateDayType, moveDay, rerollDay } = useSchedule();

  const [strengthDays, setStrengthDays] = useState(3);
  const [maxDuration, setMaxDuration] = useState(30);
  const [diffMin, setDiffMin] = useState(4);
  const [diffMax, setDiffMax] = useState(8);
  const [instructorIds, setInstructorIds] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [generated, setGenerated] = useState(schedule.length > 0);
  const [rerollIndex, setRerollIndex] = useState(null);

  // Instructor list rarely changes and is cached client-side — load once.
  useEffect(() => {
    getInstructors().then(setInstructors).catch(() => setInstructors([]));
  }, []);

  const toggleInstructor = (id) =>
    setInstructorIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const generate = () => {
    setGenerated(true);
    planWeek({
      strengthDays,
      cycleCount: 1,
      difficultyMin: diffMin,
      difficultyMax: diffMax,
      instructorIds,
      maxDuration,
    });
  };

  return (
    <Modal title="Plan the Week" onClose={onClose} wide>
      <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 6 }}>
        Set this week&apos;s criteria, then let the board fill itself.
      </p>

      <Stepper label="Strength days" value={strengthDays} onChange={setStrengthDays} min={1} max={4} />
      <Stepper label="Max class minutes" value={maxDuration} onChange={setMaxDuration} min={5} max={60} />
      <Stepper label="Difficulty min" value={diffMin} onChange={(v) => setDiffMin(Math.min(v, diffMax))} min={1} max={10} />
      <Stepper label="Difficulty max" value={diffMax} onChange={(v) => setDiffMax(Math.max(v, diffMin))} min={1} max={10} />

      {instructors.length > 0 && (
        <div style={{ padding: '10px 0 4px' }}>
          <div style={{ fontSize: 13, marginBottom: 8 }}>Instructors</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {instructors.map((ins) => {
              const sel = instructorIds.includes(ins.id);
              return (
                <button key={ins.id} onClick={() => toggleInstructor(ins.id)} style={{ fontFamily: FONT_MONO, fontSize: 11, padding: '5px 9px', borderRadius: 12, border: `1px solid ${COLORS.bronze}`, cursor: 'pointer', background: sel ? COLORS.crimson : 'transparent', color: sel ? COLORS.parchment : COLORS.ink }}>
                  {ins.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={generate}
        disabled={loading}
        style={{ width: '100%', marginTop: 16, background: COLORS.moss, color: COLORS.parchment, border: 'none', padding: 10, borderRadius: 4, fontFamily: FONT_HEADING, fontSize: 13, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Consulting the Map…' : 'Generate Week'}
      </button>

      {error && (
        <div style={{ marginTop: 10, fontSize: 12, color: COLORS.crimson, fontFamily: FONT_MONO }}>{error}</div>
      )}

      {generated && schedule.length > 0 && (
        <ScheduleList
          schedule={schedule}
          onChangeType={updateDayType}
          onMove={moveDay}
          onRerollDay={setRerollIndex}
        />
      )}

      {rerollIndex != null && schedule[rerollIndex] && (
        <RerollModal
          day={schedule[rerollIndex]}
          instructors={instructors}
          onClose={() => setRerollIndex(null)}
          onConfirm={(opts) => rerollDay(rerollIndex, opts)}
        />
      )}
    </Modal>
  );
}
