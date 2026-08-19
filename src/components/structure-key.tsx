"use client";

import { formatWeight } from "@/lib/format";
import { colorForIndex } from "@/lib/palette";
import type { PublicHolding } from "@/lib/portfolio";

export function StructureKey({
  holdings,
  activeId,
  onHover,
  onSelect,
}: {
  holdings: PublicHolding[];
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="structure-key">
      {holdings.map((row, index) => {
        const active = activeId === row.symbol;
        return (
          <button
            key={row.symbol}
            type="button"
            aria-pressed={active}
            className={`structure-key-item ${active ? "is-active" : ""}`}
            onMouseEnter={() => onHover(row.symbol)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(row.symbol)}
            onBlur={() => onHover(null)}
            onClick={() => onSelect(row.symbol)}
          >
            <span className="holding-swatch" style={{ background: colorForIndex(index) }} />
            <span className="ticker">{row.symbol}</span>
            <span className="font-num text-[var(--muted)]">{formatWeight(row.weight)}</span>
          </button>
        );
      })}
    </div>
  );
}
