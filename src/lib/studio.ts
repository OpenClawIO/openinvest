import { colorForIndex } from "@/lib/palette";
import type { PublicHolding } from "@/lib/portfolio";

export type StudioVolume = {
  id: string;
  color: string;
  weight: number;
  label: string;
};

export function barWidth(weight: number, span = 2.55) {
  return Math.max(weight * span, 0.2);
}

export function volumesFromHoldings(holdings: PublicHolding[]): StudioVolume[] {
  return holdings.map((holding, index) => ({
    id: holding.symbol,
    color: colorForIndex(index),
    weight: holding.weight,
    label: holding.symbol,
  }));
}
