export const HOLDING_COLORS = ["#f3d4a0", "#6ea0c4", "#b39ad0", "#7fb89a"] as const;
export const CASH_COLOR = "#5a5e68";

export function colorForIndex(index: number) {
  return HOLDING_COLORS[index % HOLDING_COLORS.length];
}
