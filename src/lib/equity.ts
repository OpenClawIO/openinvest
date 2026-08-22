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

export function mergePoints(...lists: Array<EquityPoint[] | undefined>): EquityPoint[] {
  const byDate = new Map<string, EquityPoint>();
  for (const list of lists) {
    for (const point of list ?? []) byDate.set(point.asOf, point);
  }
  return [...byDate.values()].sort((a, b) => a.asOf.localeCompare(b.asOf));
}

export function mergeSeries(
  previous: EquityPoint[] | undefined,
  snapshot: PublicSnapshot,
): EquityPoint[] {
  const current = pointFromSnapshot(snapshot);
  const byDate = new Map<string, EquityPoint>();

  for (const point of previous ?? []) {
    byDate.set(point.asOf, point);
  }
  for (const point of snapshot.series ?? []) {
    const existing = byDate.get(point.asOf);
    byDate.set(point.asOf, {
      asOf: point.asOf,
      nav: point.nav,
      costBasis: point.costBasis > 0 ? point.costBasis : existing?.costBasis ?? 0,
    });
  }
  byDate.set(current.asOf, current);

  const firstKnownCost = [...byDate.values()]
    .filter((point) => point.costBasis > 0)
    .sort((a, b) => a.asOf.localeCompare(b.asOf))[0]?.asOf;
  const bookCost = current.costBasis;

  return [...byDate.values()]
    .map((point) => {
      if (point.costBasis > 0) return point;
      if (firstKnownCost && point.asOf >= firstKnownCost && bookCost > 0) {
        return { ...point, costBasis: bookCost };
      }
      return point;
    })
    .sort((a, b) => a.asOf.localeCompare(b.asOf));
}

export function seriesForChart(snapshot: PublicSnapshot): EquityPoint[] {
  return mergeSeries(snapshot.series, snapshot);
}
