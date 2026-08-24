import { GOLD_COLOR, JADE_COLOR } from "@/lib/key-geometry";

export function KeySilhouette() {
  return (
    <svg viewBox="0 0 110 300" className="key-silhouette" role="img" aria-label="Heaven-round earth-square key">
      <circle cx="48" cy="46" r="34" fill={GOLD_COLOR} />
      <circle cx="48" cy="46" r="32" fill={JADE_COLOR} />
      <rect x="37" y="35" width="22" height="22" fill="none" stroke={GOLD_COLOR} strokeWidth="4" />
      <rect x="44.5" y="80" width="7" height="152" rx="3.5" fill={GOLD_COLOR} />
      <circle cx="48" cy="82" r="8" fill={GOLD_COLOR} />
      <circle cx="48" cy="90" r="6" fill={GOLD_COLOR} />
      <rect x="50" y="228" width="36" height="26" fill="none" stroke={GOLD_COLOR} strokeWidth="3.2" />
      <rect x="57" y="235" width="22" height="12" fill="none" stroke={GOLD_COLOR} strokeWidth="2.4" />
    </svg>
  );
}
