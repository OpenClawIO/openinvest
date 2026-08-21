export const SLICE_COLORS = ["#6ea8ff", "#3ee0b0", "#e4c36a", "#c08a6a"] as const;

export function colorForIndex(index: number) {
  return SLICE_COLORS[((index % SLICE_COLORS.length) + SLICE_COLORS.length) % SLICE_COLORS.length];
}
