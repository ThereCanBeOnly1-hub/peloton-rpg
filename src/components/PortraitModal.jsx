// Full-size character portrait popup. Placeholder until a custom image is added.
import { User } from 'lucide-react';
import Modal from './Modal.jsx';
import { COLORS } from '../constants/colors.js';

export default function PortraitModal({ onClose }) {
  return (
    <Modal title="Character Portrait" onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
        <div style={{ width: 200, height: 200, borderRadius: '50%', background: COLORS.stone, border: `4px solid ${COLORS.iron}`, boxShadow: `0 0 0 4px ${COLORS.bronze}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={84} color={COLORS.parchmentDim} />
        </div>
      </div>
      <p style={{ fontSize: 13, textAlign: 'center', color: COLORS.bronze, marginTop: 10 }}>
        Upload your own image to replace this portrait.
      </p>
    </Modal>
  );
}
