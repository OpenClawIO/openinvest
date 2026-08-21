"use client";

import { formatMoney } from "@/lib/format";
import type { DisplayCurrency } from "@/lib/fx";
import type { CashStack } from "@/lib/studio";

export function StructureKey({
  stacks,
  currency,
  activeId,
  onHover,
  onSelect,
}: {
  stacks: CashStack[];
  currency: DisplayCurrency;
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
            <span
              className="holding-swatch"
              style={{ background: currency === "CNY" ? "#8d1f2f" : "#1c5c3c" }}
            />
            <span className="ticker">{stack.label}</span>
            <span className="font-num text-[var(--muted)]">{formatMoney(stack.amount, 0, currency)}</span>
          </button>
        );
      })}
    </div>
  );
}
