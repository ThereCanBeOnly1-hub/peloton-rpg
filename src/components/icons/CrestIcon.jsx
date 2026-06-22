// Boss crown marker — rendered above the boss tile. Custom single-stroke SVG.
export default function CrestIcon({ size = 24, color = '#000' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8 L6.4 5.4 L9 9.1 L12 4.4 L15 9.1 L17.6 5.4 L20 8 L18.4 15.2 Q12 17.6 5.6 15.2 Z" />
    </svg>
  );
}
