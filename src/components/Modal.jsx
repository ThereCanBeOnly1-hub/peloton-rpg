// Shared modal shell. Modals should read like scrolls/notices: parchment
// background, ink text, 3px double bronze border — not like app dialogs.
import { X } from 'lucide-react';
import { COLORS } from '../constants/colors.js';
import { FONT_BODY, FONT_HEADING } from '../constants/fonts.js';

export default function Modal({ title, onClose, children, wide }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(8,6,4,0.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.parchment, color: COLORS.ink,
          border: `3px double ${COLORS.bronze}`, borderRadius: 6,
          maxWidth: wide ? 420 : 360, width: '100%', padding: '20px 18px',
          boxShadow: '0 16px 50px rgba(0,0,0,0.65)', position: 'relative',
          fontFamily: FONT_BODY, maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: COLORS.bronze, padding: 4 }}
        >
          <X size={18} />
        </button>
        <div className="uppercase mb-1" style={{ fontFamily: FONT_HEADING, fontSize: 11, letterSpacing: '0.15em', color: COLORS.bronze }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}
