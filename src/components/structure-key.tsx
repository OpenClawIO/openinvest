"use client";

import type { Slice } from "@/lib/chart-model";
import { formatMoney, formatWeight } from "@/lib/format";
import type { DisplayCurrency } from "@/lib/fx";

export function StructureKey({
  slices,
  currency,
  activeId,
  onHover,
  onSelect,
}: {
  slices: Slice[];
  currency: DisplayCurrency;
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="structure-key">
      {slices.map((slice) => {
        const active = activeId === slice.id;
        return (
          <button
            key={slice.id}
            type="button"
            aria-pressed={active}
            className={`structure-key-item ${active ? "is-active" : ""}`}
            onMouseEnter={() => onHover(slice.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(slice.id)}
            onBlur={() => onHover(null)}
            onClick={() => onSelect(slice.id)}
          >
            <span className="holding-swatch" style={{ background: slice.color }} />
            <span className="ticker">{slice.label}</span>
            <span className="font-num text-[var(--muted)]">{formatWeight(slice.weight)}</span>
            <span className="font-num text-[var(--faint)]">{formatMoney(slice.value, 0, currency)}</span>
          </button>
        );
      })}
    </div>
  );
}
