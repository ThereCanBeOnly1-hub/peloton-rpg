// Cycle days — a wagon wheel, not a bicycle. Custom single-stroke SVG.
export default function WheelIcon({ size = 24, color = '#000' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="8.2" />
      <circle cx="12" cy="12" r="1.3" fill={color} stroke="none" />
      <line x1="12" y1="12" x2="11.8" y2="3.9" />
      <line x1="12" y1="12" x2="18.3" y2="8.1" />
      <line x1="12" y1="12" x2="18.1" y2="15.9" />
      <line x1="12" y1="12" x2="12.2" y2="20.1" />
      <line x1="12" y1="12" x2="5.8" y2="15.7" />
      <line x1="12" y1="12" x2="5.9" y2="8.2" />
    </svg>
  );
}
