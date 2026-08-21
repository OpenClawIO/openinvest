import { colorForIndex } from "@/lib/palette";
import type { EquityPoint, PublicSnapshot } from "@/lib/portfolio";

export type Slice = {
  id: string;
  label: string;
  value: number;
  weight: number;
  color: string;
};

export type Arc = Slice & {
  startAngle: number;
  endAngle: number;
  midAngle: number;
  d: string;
};

export type LinePoint = {
  asOf: string;
  nav: number;
  costBasis: number;
  x: number;
  yNav: number;
  yCost: number;
};

export type LineLayout = {
  width: number;
  height: number;
  inner: { left: number; right: number; top: number; bottom: number };
  navPath: string;
  costPath: string;
  bandPath: string;
  points: LinePoint[];
  yTicks: { value: number; y: number }[];
  xTicks: { asOf: string; x: number }[];
  yMin: number;
  yMax: number;
};

const TAU = Math.PI * 2;
const GAP = 0.028;
const CASH_SLICE = "#8b97ad";
const MIN_CASH_WEIGHT = 0.004;

export function slicesFromSnapshot(
  snapshot: PublicSnapshot,
  values: { id: string; value: number }[],
): Slice[] {
  const total = values.reduce((sum, row) => sum + Math.max(row.value, 0), 0);
  return values
    .filter((row) => row.value > 0)
    .map((row) => {
      const holding = snapshot.holdings.find((item) => item.symbol === row.id);
      return {
        id: row.id,
        label: row.id,
        value: row.value,
        weight: holding?.weight ?? (total > 0 ? row.value / total : 0),
        color: holding ? colorForIndex(snapshot.holdings.indexOf(holding)) : CASH_SLICE,
      };
    });
}

export function allocationValues(
  snapshot: PublicSnapshot,
  amount: (usd: number) => number,
): { id: string; value: number }[] {
  const rows = snapshot.holdings.map((holding) => ({
    id: holding.symbol,
    value: amount(holding.marketValue),
  }));
  const cashWeight = snapshot.nav > 0 ? snapshot.cash / snapshot.nav : 0;
  if (cashWeight >= MIN_CASH_WEIGHT) {
    rows.push({ id: "CASH", value: amount(snapshot.cash) });
  }
  return rows;
}

export function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

export function donutPath(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  start: number,
  end: number,
) {
  const large = end - start > Math.PI ? 1 : 0;
  const [x0, y0] = polar(cx, cy, outer, start);
  const [x1, y1] = polar(cx, cy, outer, end);
  const [x2, y2] = polar(cx, cy, inner, end);
  const [x3, y3] = polar(cx, cy, inner, start);
  return `M ${x0} ${y0} A ${outer} ${outer} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${inner} ${inner} 0 ${large} 0 ${x3} ${y3} Z`;
}

export function pieArcs(
  slices: Slice[],
  {
    cx,
    cy,
    inner,
    outer,
  }: {
    cx: number;
    cy: number;
    inner: number;
    outer: number;
  },
): Arc[] {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (total <= 0) return [];
  let angle = -Math.PI / 2;
  const usable = TAU - GAP * slices.length;
  return slices.map((slice) => {
    const sweep = (slice.value / total) * usable;
    const start = angle + GAP / 2;
    const end = start + sweep;
    const mid = (start + end) / 2;
    angle = end + GAP / 2;
    return {
      ...slice,
      startAngle: start,
      endAngle: end,
      midAngle: mid,
      d: donutPath(cx, cy, inner, outer, start, end),
    };
  });
}

function niceNum(range: number, round: boolean) {
  const exp = Math.floor(Math.log10(Math.max(range, Number.EPSILON)));
  const f = range / 10 ** exp;
  let nf: number;
  if (round) {
    if (f < 1.5) nf = 1;
    else if (f < 3) nf = 2;
    else if (f < 7) nf = 5;
    else nf = 10;
  } else if (f <= 1) nf = 1;
  else if (f <= 2) nf = 2;
  else if (f <= 5) nf = 5;
  else nf = 10;
  return nf * 10 ** exp;
}

export function niceScale(min: number, max: number, count = 4) {
  const pad = (max - min) * 0.08 || Math.abs(max) * 0.04 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const span = niceNum(hi - lo, false);
  const step = niceNum(span / Math.max(count - 1, 1), true);
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= end + step / 2; value += step) {
    ticks.push(value);
  }
  return { min: start, max: end, ticks };
}

function polyline(points: [number, number][]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point[0]} ${point[1]}`).join(" ");
}

export function layoutLine(
  series: EquityPoint[],
  amount: (usd: number) => number,
  width = 640,
  height = 300,
): LineLayout {
  const left = 68;
  const right = width - 18;
  const top = 22;
  const bottom = height - 34;
  const display = series.map((point) => ({
    asOf: point.asOf,
    nav: amount(point.nav),
    costBasis: amount(point.costBasis),
  }));
  const values = display.flatMap((point) => [point.nav, point.costBasis]);
  const scale = niceScale(Math.min(...values), Math.max(...values));
  const times = display.map((point) => Date.parse(`${point.asOf}T00:00:00Z`));
  const t0 = times[0] ?? 0;
  const t1 = times.at(-1) ?? t0;
  const span = Math.max(t1 - t0, 1);
  const xAt = (time: number) =>
    display.length === 1 ? (left + right) / 2 : left + ((time - t0) / span) * (right - left);
  const yAt = (value: number) =>
    bottom - ((value - scale.min) / Math.max(scale.max - scale.min, 1)) * (bottom - top);

  const points: LinePoint[] = display.map((point, index) => ({
    ...point,
    x: xAt(times[index] ?? t0),
    yNav: yAt(point.nav),
    yCost: yAt(point.costBasis),
  }));

  const navPts = points.map((point) => [point.x, point.yNav] as [number, number]);
  const costPts = points.map((point) => [point.x, point.yCost] as [number, number]);
  const band = [
    ...points.map((point) => [point.x, point.yNav] as [number, number]),
    ...[...points].reverse().map((point) => [point.x, point.yCost] as [number, number]),
  ];

  return {
    width,
    height,
    inner: { left, right, top, bottom },
    navPath: polyline(navPts),
    costPath: polyline(costPts),
    bandPath: band.length ? `${polyline(band)} Z` : "",
    points,
    yTicks: scale.ticks.map((value) => ({ value, y: yAt(value) })),
    xTicks: points.map((point) => ({ asOf: point.asOf, x: point.x })),
    yMin: scale.min,
    yMax: scale.max,
  };
}
