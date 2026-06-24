// Boss day — a crenellated keep with two towers and a banner. Self-colored
// (crimson stone, gold trim). Replaces a plain seal for the week's boss.
export default function CastleIcon({ size = 64 }) {
  return (
    <svg width={size} height={(size * 60) / 74} viewBox="0 0 74 60" strokeLinejoin="round">
      <line x1="37" y1="14" x2="37" y2="2" stroke="#D9A441" strokeWidth="1.6" />
      <path d="M37 2 L50 5 L46 9 L50 13 L37 13 Z" fill="#D9A441" />
      <path d="M6 26 h5 v-5 h5 v5 h5 v32 h-20 z" fill="#7A2E2E" stroke="#D9A441" strokeWidth="1.5" />
      <path d="M53 26 h5 v-5 h5 v5 h5 v32 h-20 z" fill="#7A2E2E" stroke="#D9A441" strokeWidth="1.5" />
      <path d="M22 20 h5 v-6 h5 v6 h5 v-6 h5 v6 h5 v38 h-30 z" fill="#8a3636" stroke="#D9A441" strokeWidth="1.6" />
      <path d="M32 58 v-12 a5 5 0 0 1 10 0 v12 z" fill="#3a1414" />
      <rect x="13" y="34" width="6" height="8" rx="1" fill="#3a1414" />
      <rect x="55" y="34" width="6" height="8" rx="1" fill="#3a1414" />
    </svg>
  );
}
