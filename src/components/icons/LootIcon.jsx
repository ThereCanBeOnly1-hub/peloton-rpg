// Loot trophies dropped on the map when a quest is cleared. Self-colored
// (gold/steel/gem tones) so they pop on parchment. Ids come from LOOT_POOLS.
const PATHS = {
  sword: (
    <g fill="none" stroke="#caa64a" strokeWidth="1.4" strokeLinecap="round">
      <path d="M12 2 L13.6 13 L10.4 13 Z" fill="#E7D6A8" />
      <line x1="12" y1="13" x2="12" y2="20" />
      <line x1="8.5" y1="15" x2="15.5" y2="15" />
    </g>
  ),
  shield: (
    <g>
      <path d="M12 3 L19 6 V12 Q19 18 12 21 Q5 18 5 12 V6 Z" fill="#7e8a93" stroke="#D9A441" strokeWidth="1.3" />
      <path d="M12 6 V18 M7 9 H17" stroke="#D9A441" strokeWidth="1" fill="none" />
    </g>
  ),
  helm: <path d="M5 12 a7 7 0 0 1 14 0 v5 h-3 v-3 h-2 v3 h-4 v-3 h-2 v3 h-3 z" fill="#7e8a93" stroke="#D9A441" strokeWidth="1.2" />,
  coin: (
    <g>
      <circle cx="12" cy="12" r="9" fill="#E0B23E" stroke="#a87f1e" strokeWidth="1.4" />
      <path d="M12 7 l1.4 3 3.1.3 -2.3 2 .8 3 -3-1.7 -3 1.7 .8-3 -2.3-2 3.1-.3 z" fill="#f6d877" />
    </g>
  ),
  potion: (
    <g>
      <path d="M10 3 h4 v3 l3 5 a5 6 0 0 1 -10 0 l3 -5 z" fill="#3aa0a0" stroke="#D9A441" strokeWidth="1.3" />
      <rect x="9.5" y="2" width="5" height="2" fill="#6B4F2E" />
    </g>
  ),
  scroll: (
    <g>
      <rect x="5" y="5" width="14" height="14" rx="2" fill="#E7D6A8" stroke="#6B4F2E" strokeWidth="1.3" />
      <path d="M8 9 H16 M8 12 H16 M8 15 H13" stroke="#6B4F2E" strokeWidth="1" />
    </g>
  ),
  chest: (
    <g>
      <rect x="3" y="10" width="18" height="11" rx="2" fill="#7a531f" stroke="#D9A441" strokeWidth="1.4" />
      <path d="M3 10 a9 5 0 0 1 18 0 z" fill="#925f22" stroke="#D9A441" strokeWidth="1.4" />
      <rect x="10.5" y="12" width="3" height="5" rx="1" fill="#D9A441" />
    </g>
  ),
  crown: (
    <g>
      <path d="M3 8 L7 4 L11 9 L14 3 L17 9 L21 4 L25 8 L23 18 Q14 20 5 18 Z" transform="translate(-2,1)" fill="#E0B23E" stroke="#a87f1e" strokeWidth="1.3" />
      <circle cx="12" cy="7" r="1.5" fill="#E24B4A" />
    </g>
  ),
};

export default function LootIcon({ id, size = 26 }) {
  const content = PATHS[id];
  if (!content) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {content}
    </svg>
  );
}
