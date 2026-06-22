// Credentials entry. Shown when the session is missing/expired. Credentials go
// straight to /api/auth and are never stored client-side; the session lives in
// an httpOnly cookie set by the server.
import { useState } from 'react';
import Modal from './Modal.jsx';
import { COLORS } from '../constants/colors.js';
import { FONT_BODY, FONT_HEADING, FONT_MONO } from '../constants/fonts.js';
import { login } from '../api/peloton.js';

const field = {
  width: '100%', boxSizing: 'border-box', padding: '9px 10px', marginBottom: 10,
  border: `1px solid ${COLORS.bronze}`, borderRadius: 4, background: 'rgba(0,0,0,0.05)',
  color: COLORS.ink, fontFamily: FONT_BODY, fontSize: 14,
};

export default function LoginModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Login failed — check your credentials.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Sign In to Peloton" onClose={onClose}>
      <h2 style={{ fontFamily: FONT_HEADING, fontSize: 17, margin: '4px 0 8px' }}>Unlock the Quest Board</h2>
      <p style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 14, color: COLORS.bronze }}>
        Your Peloton login is sent securely to fetch your classes. It is never stored on this device.
      </p>
      <form onSubmit={submit}>
        <input style={field} type="email" placeholder="Email" value={email} autoComplete="username" onChange={(e) => setEmail(e.target.value)} required />
        <input style={field} type="password" placeholder="Password" value={password} autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} required />
        {error && <div style={{ fontSize: 12, color: COLORS.crimson, fontFamily: FONT_MONO, marginBottom: 10 }}>{error}</div>}
        <button type="submit" disabled={busy} style={{ width: '100%', background: COLORS.moss, color: COLORS.parchment, border: 'none', padding: 10, borderRadius: 4, fontFamily: FONT_HEADING, fontSize: 13, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}>
          {busy ? 'Signing In…' : 'Sign In'}
        </button>
      </form>
    </Modal>
  );
}
