// Rest days. Custom single-stroke SVG.
export default function TorchIcon({ size = 24, color = '#000' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21 L12.1 13.4" />
      <path d="M9.2 13.4 Q8.9 10.8 12 6.3 Q15.1 10.9 14.7 13.5 Z" />
      <path d="M10.3 12.9 Q10.6 11.3 12.1 8.7" />
    </svg>
  );
}
