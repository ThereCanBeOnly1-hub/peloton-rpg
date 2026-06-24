// Rest days — a campfire (crossed logs + flame). Self-colored (gold flame,
// bronze logs) so it reads regardless of the seal background.
export default function CampfireIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5 C14.6 8.4 14.6 10.6 13 12.6 C12.3 13.4 11 13.2 11 11.8 C11 11 11.4 10.7 11 9.9 C10 11 9.5 12 9.5 13.1 C9.5 15.1 10.8 16.2 12 16.2 C14.1 16.2 15.6 14.6 15.6 12.3 C15.6 9 13.6 6.5 12 5 Z" fill="#E08A2B" stroke="#D9A441" strokeWidth="1" />
      <path d="M6 19 L18 15.6 M6 15.6 L18 19" stroke="#6B4F2E" strokeWidth="1.8" />
    </svg>
  );
}
