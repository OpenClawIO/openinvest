"use client";

import type { DisplayCurrency } from "@/lib/fx";
import { notePalette } from "@/lib/note-geometry";
import type { CashStack } from "@/lib/studio";

export function StructureBars({
  stacks,
  currency,
  activeId,
  onHover,
  onSelect,
  ariaLabel,
}: {
  stacks: CashStack[];
  currency: DisplayCurrency;
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className="cash-piles" role="group" aria-label={ariaLabel}>
      {stacks.map((stack) => {
        const active = activeId === stack.id;
        const dimmed = activeId != null && !active;
        return (
          <button
            key={stack.id}
            type="button"
            aria-pressed={active}
            aria-label={stack.label}
            className={`cash-pile ${active ? "is-active" : ""} ${dimmed ? "is-dim" : ""}`}
            onMouseEnter={() => onHover(stack.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(stack.id)}
            onBlur={() => onHover(null)}
            onClick={() => onSelect(stack.id)}
          >
            {stack.pieces.map((piece, index) => {
              const colors = notePalette(currency, piece.denom);
              return (
                <span
                  key={`${piece.denom}-${piece.kind}-${index}`}
                  className={`cash-note ${piece.kind !== "note" ? "is-strap" : ""}`}
                  data-currency={currency}
                  style={{ background: colors.paper, color: colors.ink }}
                >
                  <span className="cash-note-mark">{currency === "CNY" ? "人民币" : "USD"}</span>
                  <span className="cash-note-num">
                    {currency === "CNY" ? piece.denom : `$${piece.denom}`}
                  </span>
                  {piece.kind !== "note" ? (
                    <span className="cash-note-pack">{piece.kind === "strap100" ? "×100" : "×10"}</span>
                  ) : null}
                </span>
              );
            })}
          </button>
        );
      })}
    </div>
  );
}
