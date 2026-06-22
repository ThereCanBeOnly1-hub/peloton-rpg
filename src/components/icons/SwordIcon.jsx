// Strength days. Custom single-stroke SVG — do NOT swap for a modern icon lib.
export default function SwordIcon({ size = 24, color = '#000' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 L13.4 14.2 L10.8 14 Z" />
      <line x1="12" y1="14" x2="12.2" y2="20.3" />
      <line x1="8.6" y1="15.4" x2="15.6" y2="15.1" />
      <path d="M10.7 19.8 Q12 22.2 13.4 19.9" />
    </svg>
  );
}
