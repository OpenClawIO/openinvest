import type { EquityPoint, PublicSnapshot } from "@/lib/portfolio";

export function costBasisOf(snapshot: Pick<PublicSnapshot, "holdings">) {
  return snapshot.holdings.reduce((sum, holding) => sum + holding.costBasis, 0);
}

export function pointFromSnapshot(snapshot: PublicSnapshot): EquityPoint {
  return {
    asOf: snapshot.asOf,
    nav: snapshot.nav,
    costBasis: costBasisOf(snapshot),
  };
}

export function mergeSeries(
  previous: EquityPoint[] | undefined,
  snapshot: PublicSnapshot,
): EquityPoint[] {
  const next = pointFromSnapshot(snapshot);
  const byDate = new Map((previous ?? []).map((point) => [point.asOf, point]));
  byDate.set(next.asOf, next);
  return [...byDate.values()].sort((a, b) => a.asOf.localeCompare(b.asOf));
}

export function seriesForChart(snapshot: PublicSnapshot): EquityPoint[] {
  return mergeSeries(snapshot.series, snapshot);
}
