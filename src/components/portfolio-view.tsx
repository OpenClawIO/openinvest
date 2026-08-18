"use client";

import { AllocationRing, type RingSlice } from "@/components/allocation-ring";
import { LanguageSwitch } from "@/components/language-switch";
import { useLocale } from "@/components/locale-provider";
import {
  formatLongDate,
  formatMoney,
  formatPct,
  formatQty,
  formatSignedMoney,
  formatWeight,
  pnlTone,
} from "@/lib/format";
import type { Copy, Locale } from "@/lib/i18n";
import { CASH_COLOR, colorForIndex } from "@/lib/palette";
import type { PublicHolding, PublicSnapshot } from "@/lib/portfolio";
import { useMemo, useState } from "react";

function kicker(locale: Locale) {
  return locale === "zh" ? "kicker-zh" : "kicker";
}

export function PortfolioView({ snapshot }: { snapshot: PublicSnapshot }) {
  const { locale, t } = useLocale();
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const activeId = hoverId ?? pinnedId;

  const costBasis = snapshot.holdings.reduce((sum, row) => sum + row.costBasis, 0);
  const vsCost = costBasis > 0 ? snapshot.unrealizedPnl / costBasis : 0;
  const cashWeight = snapshot.nav > 0 ? snapshot.cash / snapshot.nav : 0;
  const asOf = formatLongDate(snapshot.asOf, locale);
  const tone = pnlTone(snapshot.unrealizedPnl);

  const slices: RingSlice[] = useMemo(() => {
    const holdingSlices = snapshot.holdings.map((row, index) => ({
      id: row.symbol,
      label: `${row.symbol} ${formatWeight(row.weight)}`,
      value: Math.max(row.marketValue, 0),
      color: colorForIndex(index),
    }));
    if (snapshot.cash > 1) {
      holdingSlices.push({
        id: "CASH",
        label: `${t.cash} ${formatWeight(cashWeight)}`,
        value: snapshot.cash,
        color: CASH_COLOR,
      });
    }
    return holdingSlices;
  }, [cashWeight, snapshot.cash, snapshot.holdings, t.cash]);

  const activeHolding = snapshot.holdings.find((row) => row.symbol === activeId);

  const select = (id: string) => {
    setPinnedId((current) => (current === id ? null : id));
  };

  return (
    <div className="page-shell relative mx-auto min-h-dvh max-w-[1120px]">
      <header className="glass rise sticky top-[max(0.5rem,env(safe-area-inset-top))] z-20 flex items-center justify-between gap-3 rounded-[16px] px-3 py-2.5 sm:top-4 sm:gap-4 sm:rounded-[18px] sm:px-5 sm:py-3">
        <div className="min-w-0">
          <p className="brand-mark text-[10px] text-[var(--copper)] sm:text-[11px]">
            {t.brand}
          </p>
          <p className="mt-1 hidden text-sm text-[var(--muted)] sm:block">{t.tagline}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <p className="hidden font-num text-xs text-[var(--muted)] sm:block">
            {asOf} · T+1
          </p>
          <LanguageSwitch />
        </div>
      </header>

      <section className="mt-8 grid items-center gap-8 sm:mt-12 lg:mt-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] lg:gap-10">
        <div className="rise" style={{ animationDelay: "70ms" }}>
          <p className={kicker(locale)}>{t.nav}</p>
          <p className="mt-2 font-num text-xs text-[var(--muted)] sm:hidden">
            {asOf} · T+1
          </p>
          <h1 className="font-display mt-3 break-words text-[clamp(2.85rem,13vw,6.4rem)] leading-[0.9] sm:mt-4 sm:leading-[0.88]">
            {formatMoney(snapshot.nav)}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:mt-6 sm:gap-3">
            <span
              className={`font-num rounded-full px-3 py-1 text-sm ${
                tone === "down"
                  ? "bg-[rgba(255,155,144,0.14)] text-[var(--down)]"
                  : tone === "up"
                    ? "bg-[rgba(158,224,180,0.14)] text-[var(--up)]"
                    : "text-[var(--muted)]"
              }`}
            >
              {formatSignedMoney(snapshot.unrealizedPnl)}
            </span>
            <span
              className={`flex items-baseline gap-1.5 text-sm ${
                tone === "down"
                  ? "text-[var(--down)]"
                  : tone === "up"
                    ? "text-[var(--up)]"
                    : "text-[var(--muted)]"
              }`}
            >
              <span className="font-num">{formatPct(vsCost)}</span>
              <span>{t.vsCost}</span>
            </span>
          </div>
          <p className="dek mt-5 sm:mt-6">{t.dek(snapshot.holdings.length)}</p>
        </div>

        <div
          className="rise flex flex-col items-center px-0 py-0 sm:px-2 sm:py-2"
          style={{ animationDelay: "140ms" }}
        >
          <AllocationRing
            slices={slices}
            activeId={activeId}
            onActive={setHoverId}
            onSelect={select}
            centerValue={String(snapshot.holdings.length)}
            centerLabel={t.names(snapshot.holdings.length)}
            ariaLabel={t.allocation}
            locale={locale}
          />
          <ul className="mt-4 flex w-full max-w-sm flex-wrap justify-center gap-1 sm:mt-5 sm:max-w-[280px] sm:flex-col sm:gap-0">
            {slices.map((slice, index) => {
              const selected = activeId === slice.id;
              return (
                <li key={slice.id} className="max-sm:shrink-0 sm:w-full">
                  <button
                    type="button"
                    className="flex min-h-11 items-center justify-between rounded-full px-3 py-2 text-left text-sm transition-colors max-sm:w-auto sm:w-full sm:rounded-xl sm:px-2"
                    style={{ background: selected ? "rgba(255,255,255,0.08)" : "transparent" }}
                    onMouseEnter={() => setHoverId(slice.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onClick={() => select(slice.id)}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: slice.color }}
                      />
                      {slice.id === "CASH" ? (
                        t.cash
                      ) : (
                        <span className="ticker">
                          {snapshot.holdings[index]?.symbol ?? slice.id}
                        </span>
                      )}
                    </span>
                    <span className="font-num text-[var(--muted)]">
                      {formatWeight(
                        slice.id === "CASH"
                          ? cashWeight
                          : snapshot.holdings[index]?.weight ?? 0,
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 min-h-0 max-w-[280px] text-center text-xs leading-5 text-[var(--faint)] sm:mt-3 sm:min-h-10">
            {activeHolding
              ? `${activeHolding.description} · ${t.shares(formatQty(activeHolding.quantity))} · ${formatMoney(activeHolding.markPrice)}`
              : "\u00a0"}
          </p>
        </div>
      </section>

      <section className="rise mt-10 sm:mt-14" style={{ animationDelay: "180ms" }}>
        <div className="glass overflow-hidden rounded-[16px] sm:rounded-[22px]">
          <div className="px-4 py-5 sm:px-5 sm:py-6">
            <h2 className={kicker(locale)}>{t.costToMarket}</h2>
            <PnlBridge
              cost={costBasis}
              nav={snapshot.nav}
              pnl={snapshot.unrealizedPnl}
              t={t}
            />
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-[var(--line)] px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
            <h2 className={kicker(locale)}>{t.positions}</h2>
            <p className="text-xs text-[var(--faint)]">
              {t.listed(snapshot.holdings.length, formatMoney(snapshot.cash))}
            </p>
          </div>
          {snapshot.holdings.map((row, index) => (
            <HoldingRow
              key={row.symbol}
              row={row}
              color={colorForIndex(index)}
              active={activeId === row.symbol}
              onHover={setHoverId}
              onSelect={select}
              t={t}
            />
          ))}
          <div className="border-t border-[var(--line)] px-4 py-4 sm:px-5 sm:py-5">
            <h2 className={kicker(locale)}>{t.activity}</h2>
            {snapshot.trades.length === 0 ? (
              <p className="dek mt-3 text-[var(--muted)]">{t.noFills(asOf)}</p>
            ) : (
              <div className="mt-3">
                {snapshot.trades.map((trade, index) => (
                  <div
                    key={`${trade.symbol}-${trade.date}-${index}`}
                    className="grid grid-cols-2 gap-2 border-b border-[var(--line)] py-3 text-sm last:border-0 sm:grid-cols-4 sm:gap-3 sm:py-3.5"
                  >
                    <span className="font-num text-[var(--muted)]">
                      {formatLongDate(trade.date, locale)}
                    </span>
                    <span>
                      {trade.side === "BUY"
                        ? t.buy
                        : trade.side === "SELL"
                          ? t.sell
                          : trade.side}
                    </span>
                    <span className="ticker">{trade.symbol}</span>
                    <span className="font-num sm:text-right">
                      {formatQty(trade.quantity)} @ {formatMoney(trade.tradePrice)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="fine-print mt-10 max-w-3xl px-1 sm:mt-16">
        {t.footer(
          snapshot.generatedAt ? snapshot.generatedAt.replace("T", " ") : undefined,
        )}
      </footer>
    </div>
  );
}

function PnlBridge({
  cost,
  nav,
  pnl,
  t,
}: {
  cost: number;
  nav: number;
  pnl: number;
  t: Copy;
}) {
  const max = Math.max(cost, nav, 1);
  return (
    <div className="mt-3 grid gap-5 sm:mt-4 sm:grid-cols-2 sm:gap-8">
      <BridgeBar label={t.costBasis} value={cost} max={max} tone="flat" />
      <BridgeBar
        label={t.market}
        value={nav}
        max={max}
        tone={pnlTone(pnl)}
        delta={formatSignedMoney(pnl)}
      />
    </div>
  );
}

function BridgeBar({
  label,
  value,
  max,
  tone,
  delta,
}: {
  label: string;
  value: number;
  max: number;
  tone: "up" | "down" | "flat" | "muted";
  delta?: string;
}) {
  const color =
    tone === "down"
      ? "var(--down)"
      : tone === "up"
        ? "var(--up)"
        : "rgba(255,255,255,0.72)";
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-xs text-[var(--muted)]">{label}</span>
        <span className="text-right text-sm">
          <span className="font-num">{formatMoney(value)}</span>
          {delta ? <span className="font-num ml-2 text-[var(--muted)]">{delta}</span> : null}
        </span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{ width: `${(value / max) * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

function HoldingRow({
  row,
  color,
  active,
  onHover,
  onSelect,
  t,
}: {
  row: PublicHolding;
  color: string;
  active: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  t: Copy;
}) {
  const vsCost = row.costBasis > 0 ? row.unrealizedPnl / row.costBasis : 0;
  return (
    <article
      className={`relative min-h-14 cursor-pointer border-b border-[var(--line)] last:border-0 transition-colors ${
        active
          ? "bg-[rgba(255,255,255,0.07)]"
          : "active:bg-[rgba(255,255,255,0.05)] sm:hover:bg-[rgba(255,255,255,0.04)]"
      }`}
      onMouseEnter={() => onHover(row.symbol)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(row.symbol)}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 opacity-25"
        style={{ width: `${row.weight * 100}%`, background: color }}
      />
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 px-4 py-4 sm:grid-cols-[1.15fr_0.85fr_0.7fr] sm:items-center sm:gap-4 sm:px-5 sm:py-5">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 sm:gap-3">
            <span className="ticker text-base sm:text-lg">{row.symbol}</span>
            <span className="text-[11px] text-[var(--faint)] sm:text-xs">{row.exchange}</span>
          </div>
          <p className="mt-1 truncate text-sm text-[var(--muted)]">{row.description}</p>
          <p className="mt-2 hidden font-num text-xs text-[var(--faint)] sm:block">
            {t.shares(formatQty(row.quantity))} · {formatMoney(row.averageCost)} →{" "}
            {formatMoney(row.markPrice)}
          </p>
        </div>
        <div className="hidden sm:block">
          <PriceTrack cost={row.averageCost} mark={row.markPrice} t={t} />
        </div>
        <div className="text-right">
          <div className="font-num text-[15px] sm:text-base">{formatMoney(row.marketValue)}</div>
          <div
            className={`mt-1 font-num text-xs sm:text-sm ${
              pnlTone(row.unrealizedPnl) === "down"
                ? "text-[var(--down)]"
                : pnlTone(row.unrealizedPnl) === "up"
                  ? "text-[var(--up)]"
                  : "text-[var(--muted)]"
            }`}
          >
            {formatSignedMoney(row.unrealizedPnl)} · {formatPct(vsCost)}
          </div>
          <div className="mt-1 font-num text-xs text-[var(--faint)]">
            {formatWeight(row.weight)}
          </div>
        </div>
        <p className="col-span-2 font-num text-xs text-[var(--faint)] sm:hidden">
          {t.shares(formatQty(row.quantity))} · {formatMoney(row.averageCost)} →{" "}
          {formatMoney(row.markPrice)}
        </p>
      </div>
    </article>
  );
}

function PriceTrack({
  cost,
  mark,
  t,
}: {
  cost: number;
  mark: number;
  t: Copy;
}) {
  const { locale } = useLocale();
  const min = Math.min(cost, mark) * 0.9;
  const max = Math.max(cost, mark) * 1.05;
  const span = max - min || 1;
  const costLeft = ((cost - min) / span) * 100;
  const markLeft = ((mark - min) / span) * 100;
  const start = Math.min(costLeft, markLeft);
  const width = Math.abs(markLeft - costLeft);
  const down = mark < cost;
  return (
    <div className="px-1">
      <div className="relative h-9">
        <div className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-white/15" />
        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full"
          style={{
            left: `${start}%`,
            width: `${width}%`,
            background: down ? "var(--down)" : "var(--up)",
          }}
        />
        <span
          className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70"
          style={{ left: `${costLeft}%` }}
          title={`${t.cost} ${formatMoney(cost)}`}
        />
        <span
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${markLeft}%`,
            background: down ? "var(--down)" : "var(--up)",
            boxShadow: "0 0 0 3px rgba(255,255,255,0.12)",
          }}
          title={`${t.mark} ${formatMoney(mark)}`}
        />
      </div>
      <div className={`flex justify-between text-[var(--faint)] ${locale === "zh" ? "label-zh" : "label-en"}`}>
        <span>{t.cost}</span>
        <span>{t.mark}</span>
      </div>
    </div>
  );
}
