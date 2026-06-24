// Full-size character portrait + upload. The image is downscaled to 256px and
// stored as a data URL in settings (localStorage), so it persists and shows in
// the header. Keeping it small avoids bloating localStorage.
import { useRef } from 'react';
import { User, Upload, Trash2 } from 'lucide-react';
import Modal from './Modal.jsx';
import { COLORS } from '../constants/colors.js';
import { FONT_HEADING } from '../constants/fonts.js';
import { useSchedule } from '../state/useSchedule.js';

// Read a File, downscale to a 256px square (center-cropped), return a data URL.
function downscale(file, size = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function PortraitModal({ onClose }) {
  const { settings, updateSettings } = useSchedule();
  const inputRef = useRef(null);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await downscale(file);
      updateSettings({ avatar: dataUrl });
    } catch {
      /* ignore bad image */
    }
  };

  const action = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: FONT_HEADING, fontSize: 13, padding: 10, borderRadius: 4, cursor: 'pointer',
  };

  return (
    <Modal title="Character Portrait" onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
        <div style={{ width: 200, height: 200, borderRadius: '50%', overflow: 'hidden', background: COLORS.stone, border: `4px solid ${COLORS.iron}`, boxShadow: `0 0 0 4px ${COLORS.bronze}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {settings.avatar ? (
            <img src={settings.avatar} alt="Your portrait" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={84} color={COLORS.parchmentDim} />
          )}
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={onPick} style={{ display: 'none' }} />

      <button onClick={() => inputRef.current?.click()} style={{ ...action, width: '100%', marginTop: 14, background: COLORS.moss, color: COLORS.parchment, border: 'none' }}>
        <Upload size={14} /> {settings.avatar ? 'Change Portrait' : 'Upload Portrait'}
      </button>

      {settings.avatar && (
        <button onClick={() => updateSettings({ avatar: null })} style={{ ...action, width: '100%', marginTop: 8, background: 'transparent', color: COLORS.bronze, border: `1px solid ${COLORS.bronze}` }}>
          <Trash2 size={14} /> Remove
        </button>
      )}
    </Modal>
  );
}
