// Stretch badge — appears as a small badge on paired (non-rest) days, not a
// full tile. Custom single-stroke SVG.
export default function SprigIcon({ size = 24, color = '#000' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21 C12.3 14 11.8 8 12 3" />
      <path d="M12 16.2 C9.4 15.1 8 13 7.5 10.4" />
      <path d="M12.1 12.4 C14.6 11.4 16 9.4 16.2 6.9" />
      <path d="M11.9 8.6 C9.9 7.8 9 6.3 8.7 4.5" />
    </svg>
  );
}
