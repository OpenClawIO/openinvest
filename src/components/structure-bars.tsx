"use client";

import type { CoinStack } from "@/lib/studio";

export function StructureBars({
  stacks,
  activeId,
  onHover,
  onSelect,
  ariaLabel,
}: {
  stacks: CoinStack[];
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className="coin-piles" role="group" aria-label={ariaLabel}>
      {stacks.map((stack) => {
        const active = activeId === stack.id;
        const dimmed = activeId != null && !active;
        return (
          <button
            key={stack.id}
            type="button"
            aria-pressed={active}
            aria-label={stack.label}
            className={`coin-pile ${active ? "is-active" : ""} ${dimmed ? "is-dim" : ""}`}
            onMouseEnter={() => onHover(stack.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(stack.id)}
            onBlur={() => onHover(null)}
            onClick={() => onSelect(stack.id)}
          >
            {stack.pieces.map((piece, index) => (
              <span
                key={`${piece.denom}-${index}`}
                className="coin-face"
                data-denom={piece.denom}
                style={{ opacity: piece.fill < 1 ? 0.72 : 1 }}
              >
                <span className="coin-face-mark" aria-hidden>
                  <span className="gold-mark" />
                  Au
                </span>
                <span className="coin-face-num">{piece.denom}</span>
                <span className="coin-face-unit">g</span>
              </span>
            ))}
          </button>
        );
      })}
    </div>
  );
}
