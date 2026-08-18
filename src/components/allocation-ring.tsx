"use client";

export type RingSlice = {
  id: string;
  label: string;
  value: number;
  color: string;
};

type Arc = RingSlice & { d: string };

function polar(cx: number, cy: number, r: number, angle: number) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
}

function donutPath(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  start: number,
  end: number,
) {
  const large = end - start > Math.PI ? 1 : 0;
  const [x1, y1] = polar(cx, cy, outer, start);
  const [x2, y2] = polar(cx, cy, outer, end);
  const [x3, y3] = polar(cx, cy, inner, end);
  const [x4, y4] = polar(cx, cy, inner, start);
  return `M ${x1} ${y1} A ${outer} ${outer} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z`;
}

function toArcs(slices: RingSlice[], size: number, activeId: string | null): Arc[] {
  const cx = size / 2;
  const cy = size / 2;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const gap = slices.length > 1 ? 0.05 : 0;
  let angle = -Math.PI / 2;
  return slices.map((slice) => {
    const active = activeId === slice.id;
    const outer = size * (active ? 0.448 : 0.425);
    const inner = size * (active ? 0.318 : 0.338);
    const sweep = Math.max((slice.value / total) * Math.PI * 2 - gap, 0.02);
    const start = angle + gap / 2;
    const end = start + sweep;
    angle += (slice.value / total) * Math.PI * 2;
    return { ...slice, d: donutPath(cx, cy, outer, inner, start, end) };
  });
}

export function AllocationRing({
  slices,
  activeId,
  onActive,
  onSelect,
  centerLabel,
  centerValue,
  ariaLabel,
  locale,
}: {
  slices: RingSlice[];
  activeId: string | null;
  onActive: (id: string | null) => void;
  onSelect: (id: string) => void;
  centerLabel: string;
  centerValue: string;
  ariaLabel: string;
  locale: "en" | "zh";
}) {
  const size = 320;
  const arcs = toArcs(slices, size, activeId);
  const english = locale === "en";
  const label = english ? centerLabel.toUpperCase() : centerLabel;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[210px] touch-manipulation sm:max-w-[260px] lg:max-w-[300px]"
      role="img"
      aria-label={ariaLabel}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size * 0.382}
        fill="none"
        stroke="var(--ring-track)"
        strokeWidth="28"
      />
      {arcs.map((arc) => {
        const dimmed = activeId != null && activeId !== arc.id;
        return (
          <path
            key={arc.id}
            d={arc.d}
            fill={arc.color}
            opacity={dimmed ? 0.62 : 1}
            className="cursor-pointer transition-opacity duration-200"
            tabIndex={0}
            role="button"
            aria-label={arc.label}
            onMouseEnter={() => onActive(arc.id)}
            onMouseLeave={() => onActive(null)}
            onClick={() => onSelect(arc.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(arc.id);
              }
            }}
          >
            <title>{arc.label}</title>
          </path>
        );
      })}
      <text
        x={size / 2}
        y={size / 2 - 8}
        textAnchor="middle"
        fill="var(--text)"
        fontSize="30"
        fontFamily="var(--font-display), serif"
        letterSpacing="-0.02em"
      >
        {centerValue}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 16}
        textAnchor="middle"
        fill="var(--muted)"
        fontSize={english ? 10 : 13}
        fontWeight={500}
        letterSpacing={english ? "0.14em" : "0.06em"}
        fontFamily="var(--font-sans), PingFang SC, Hiragino Sans GB, Noto Sans SC, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}
