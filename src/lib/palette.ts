export const HOLDING_COLORS = ["#2b2927", "#8d99a6", "#6b5e55", "#7a8b7e"] as const;
export const CASH_COLOR = "#c5c1ba";

export function colorForIndex(index: number): string {
  return HOLDING_COLORS[index % HOLDING_COLORS.length];
}
