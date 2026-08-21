"use client";

import { formatGrams } from "@/lib/format";
import { GOLD } from "@/lib/palette";
import type { CoinStack } from "@/lib/studio";

export function StructureKey({
  stacks,
  activeId,
  onHover,
  onSelect,
}: {
  stacks: CoinStack[];
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="structure-key">
      {stacks.map((stack) => {
        const active = activeId === stack.id;
        return (
          <button
            key={stack.id}
            type="button"
            aria-pressed={active}
            className={`structure-key-item ${active ? "is-active" : ""}`}
            onMouseEnter={() => onHover(stack.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(stack.id)}
            onBlur={() => onHover(null)}
            onClick={() => onSelect(stack.id)}
          >
            <span className="holding-swatch" style={{ background: GOLD }} />
            <span className="ticker">{stack.label}</span>
            <span className="font-num text-[var(--muted)]">{formatGrams(stack.grams)}</span>
          </button>
        );
      })}
    </div>
  );
}
