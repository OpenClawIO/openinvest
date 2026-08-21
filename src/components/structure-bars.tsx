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
        const discs = stack.coins + (stack.remainder > 0.05 ? 1 : 0);
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
            {Array.from({ length: Math.max(discs, 1) }, (_, index) => {
              const partial = index === stack.coins;
              return (
                <span
                  key={index}
                  className={`coin-disc ${partial ? "is-partial" : ""}`}
                  style={partial ? { transform: `scaleY(${Math.max(stack.remainder, 0.18)})` } : undefined}
                />
              );
            })}
          </button>
        );
      })}
    </div>
  );
}
