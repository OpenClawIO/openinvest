"use client";

import { pieArcs, type Slice } from "@/lib/chart-model";
import { formatWeight } from "@/lib/format";
import { useMemo } from "react";

const CX = 100;
const CY = 100;
const INNER = 54;
const OUTER = 88;
const OUTER_ACTIVE = 92;

export function AllocationPie({
  slices,
  activeId,
  idleLabel,
  onHover,
  onSelect,
  ariaLabel,
}: {
  slices: Slice[];
  activeId: string | null;
  idleLabel: string;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  ariaLabel: string;
}) {
  const idleArcs = useMemo(
    () => pieArcs(slices, { cx: CX, cy: CY, inner: INNER, outer: OUTER }),
    [slices],
  );
  const activeArcs = useMemo(
    () => pieArcs(slices, { cx: CX, cy: CY, inner: INNER, outer: OUTER_ACTIVE }),
    [slices],
  );
  const active = slices.find((slice) => slice.id === activeId) ?? null;
  const dim = activeId != null;

  return (
    <div className="pie-stage">
      <svg viewBox="0 0 200 200" role="img" aria-label={ariaLabel}>
        {idleArcs.map((arc) => {
          const isActive = activeId === arc.id;
          const d = isActive
            ? (activeArcs.find((item) => item.id === arc.id)?.d ?? arc.d)
            : arc.d;
          return (
            <path
              key={arc.id}
              d={d}
              fill={arc.color}
              className={`pie-slice ${dim && !isActive ? "is-dim" : ""}`}
              onMouseEnter={() => onHover(arc.id)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(arc.id)}
            >
              <title>{`${arc.label} ${formatWeight(arc.weight)}`}</title>
            </path>
          );
        })}
      </svg>
      <div className="pie-center">
        <p className="ticker text-[13px] text-[var(--muted)]">{active?.label ?? idleLabel}</p>
        <p className="font-num mt-1 text-xl text-[var(--text)]">
          {formatWeight(active?.weight ?? 1)}
        </p>
      </div>
    </div>
  );
}
