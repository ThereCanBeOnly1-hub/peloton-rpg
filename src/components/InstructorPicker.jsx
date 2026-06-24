// Searchable multi-select for favorite instructors. Replaces the wall of chips
// with a type-to-filter list; selections are saved in Settings and reused every
// week, so you set your core instructors once and never manage them again.
import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { COLORS } from '../constants/colors.js';
import { FONT_BODY, FONT_MONO } from '../constants/fonts.js';

export default function InstructorPicker({ instructors = [], selectedIds = [], onChange }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? instructors.filter((i) => i.name.toLowerCase().includes(q)) : instructors;
    // Selected instructors float to the top so they're easy to review/remove.
    return [...list].sort((a, b) => selectedIds.includes(b.id) - selectedIds.includes(a.id));
  }, [instructors, query, selectedIds]);

  const toggle = (id) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <Search size={14} color={COLORS.bronze} style={{ position: 'absolute', left: 9, top: 9 }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search instructors…"
          style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px 7px 28px', border: `1px solid ${COLORS.bronze}`, borderRadius: 4, background: 'rgba(0,0,0,0.05)', color: COLORS.ink, fontFamily: FONT_BODY, fontSize: 13 }}
        />
      </div>

      <div style={{ maxHeight: 180, overflowY: 'auto', border: `1px solid ${COLORS.bronze}55`, borderRadius: 4 }}>
        {filtered.length === 0 && (
          <div style={{ padding: 10, fontSize: 12, color: COLORS.bronze, fontFamily: FONT_MONO }}>No matches</div>
        )}
        {filtered.map((ins) => {
          const sel = selectedIds.includes(ins.id);
          return (
            <button
              key={ins.id}
              onClick={() => toggle(ins.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '7px 10px', border: 'none', borderBottom: `1px solid ${COLORS.bronze}22`, background: sel ? `${COLORS.moss}33` : 'transparent', color: COLORS.ink, cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, textAlign: 'left' }}
            >
              <span>{ins.name}</span>
              {sel && <Check size={14} color={COLORS.moss} />}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 6, fontSize: 11, fontFamily: FONT_MONO, color: COLORS.bronze }}>
        {selectedIds.length ? `${selectedIds.length} selected` : 'Any instructor'}
      </div>
    </div>
  );
}
