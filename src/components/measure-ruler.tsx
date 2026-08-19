"use client";

import { formatMoney, formatPct, formatSignedMoney, pnlTone } from "@/lib/format";
import type { Copy, Locale } from "@/lib/i18n";

function toneClass(value: number) {
  const tone = pnlTone(value);
  if (tone === "down") return "text-[var(--down)]";
  if (tone === "up") return "text-[var(--up)]";
  return "text-[var(--muted)]";
}

function toneColor(value: number) {
  const tone = pnlTone(value);
  if (tone === "down") return "var(--down)";
  if (tone === "up") return "var(--up)";
  return "var(--text)";
}

function markLeft(value: number, min: number, span: number) {
  return ((value - min) / span) * 100;
}

export function ValueRuler({
  cost,
  market,
  pnl,
  locale,
  t,
}: {
  cost: number;
  market: number;
  pnl: number;
  locale: Locale;
  t: Copy;
}) {
  const max = Math.max(cost, market, 1) * 1.04;
  const costLeft = markLeft(cost, 0, max);
  const marketLeft = markLeft(market, 0, max);
  const start = Math.min(costLeft, marketLeft);
  const width = Math.abs(marketLeft - costLeft);
  const vsCost = cost > 0 ? pnl / cost : 0;
  const labelClass = locale === "zh" ? "label-zh" : "label-en";

  return (
    <div className="measure-ruler">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className={`${labelClass} text-[var(--faint)]`}>{t.costBasis}</p>
          <p className="font-num mt-1 text-lg sm:text-xl">{formatMoney(cost)}</p>
        </div>
        <div className="text-right">
          <p className={`${labelClass} text-[var(--faint)]`}>{t.market}</p>
          <p className="font-num mt-1 text-lg sm:text-xl">{formatMoney(market)}</p>
        </div>
      </div>
      <div className="measure-track" aria-hidden>
        <div className="measure-line" />
        <div
          className="measure-span"
          style={{
            left: `${start}%`,
            width: `${width}%`,
            background: toneColor(pnl),
          }}
        />
        <span className="measure-dot measure-dot-cost" style={{ left: `${costLeft}%` }} />
        <span
          className="measure-dot measure-dot-mark"
          style={{ left: `${marketLeft}%`, background: toneColor(pnl) }}
        />
      </div>
      <p className={`mt-3 text-sm ${toneClass(pnl)}`}>
        <span className="font-num">{formatSignedMoney(pnl)}</span>
        <span className="mx-2 text-[var(--faint)]">·</span>
        <span className="font-num">{formatPct(vsCost)}</span>
        <span className="ml-1.5 text-[var(--muted)]">{t.vsCost}</span>
      </p>
    </div>
  );
}

export function PriceRuler({
  cost,
  mark,
  t,
}: {
  cost: number;
  mark: number;
  t: Copy;
}) {
  const min = Math.min(cost, mark) * 0.9;
  const max = Math.max(cost, mark) * 1.05;
  const span = max - min || 1;
  const costLeft = markLeft(cost, min, span);
  const markLeftPct = markLeft(mark, min, span);
  const start = Math.min(costLeft, markLeftPct);
  const width = Math.abs(markLeftPct - costLeft);
  const delta = mark - cost;

  return (
    <div className="px-1">
      <div className="measure-track measure-track-compact" aria-hidden>
        <div className="measure-line" />
        <div
          className="measure-span"
          style={{
            left: `${start}%`,
            width: `${width}%`,
            background: toneColor(delta),
          }}
        />
        <span className="measure-dot measure-dot-cost" style={{ left: `${costLeft}%` }} />
        <span
          className="measure-dot measure-dot-mark"
          style={{ left: `${markLeftPct}%`, background: toneColor(delta) }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[var(--faint)]">
        <span className="font-num text-[10px]">
          {t.cost} {formatMoney(cost)}
        </span>
        <span className="font-num text-[10px]">
          {t.mark} {formatMoney(mark)}
        </span>
      </div>
    </div>
  );
}
