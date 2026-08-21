export const HOLDING_COLORS = ["#8bb4ff", "#9aa6b8", "#7ed0b6", "#c9b8a6"] as const;
export const CASH_COLOR = "#4a5a73";

export function colorForIndex(index: number): string {
  return HOLDING_COLORS[index % HOLDING_COLORS.length];
}
