import { GOLD_COLOR, JADE_COLOR } from "@/lib/key-geometry";

export function KeySilhouette() {
  return (
    <svg viewBox="0 0 280 110" className="key-silhouette" role="img" aria-label="Heaven-round earth-square key">
      <circle cx="48" cy="55" r="36" fill={GOLD_COLOR} />
      <circle cx="48" cy="55" r="34" fill={JADE_COLOR} />
      <rect x="36" y="43" width="24" height="24" fill="none" stroke={GOLD_COLOR} strokeWidth="4" rx="2" />
      <rect x="80" y="51.5" width="118" height="7" rx="3.5" fill={GOLD_COLOR} />
      <circle cx="84" cy="55" r="8" fill={GOLD_COLOR} />
      <circle cx="94" cy="55" r="6.2" fill={GOLD_COLOR} />
      <rect x="196" y="38" width="48" height="34" fill="none" stroke={GOLD_COLOR} strokeWidth="3.4" rx="3" />
      <path
        d="M208 62 h24 v-12 h-16 v20 h28"
        fill="none"
        stroke={GOLD_COLOR}
        strokeWidth="3"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
