import { GOLD_COLOR, JADE_COLOR } from "@/lib/key-geometry";

export function KeySilhouette() {
  return (
    <svg viewBox="0 0 260 96" className="key-silhouette" role="img" aria-label="Heaven-round earth-square key">
      <circle cx="52" cy="48" r="40" fill={JADE_COLOR} />
      <rect x="43" y="39" width="18" height="18" fill={GOLD_COLOR} />
      <rect x="58" y="42" width="148" height="12" fill={GOLD_COLOR} />
      <rect x="198" y="36" width="24" height="24" fill={GOLD_COLOR} />
    </svg>
  );
}
