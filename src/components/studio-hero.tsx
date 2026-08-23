"use client";

import { AllocationPie } from "@/components/allocation-pie";
import { KeySilhouette } from "@/components/key-silhouette";
import { NavLine } from "@/components/nav-line";
import { StructureKey } from "@/components/structure-key";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { allocationValues, slicesFromSnapshot } from "@/lib/chart-model";
import { seriesForChart } from "@/lib/equity";
import {
  formatLongDate,
  formatMoney,
  formatPct,
  formatQty,
  formatSignedMoney,
  formatWeight,
  pnlTone,
} from "@/lib/format";
import { currencyForLocale, toDisplayAmount } from "@/lib/fx";
import type { Copy, Locale } from "@/lib/i18n";
import type { PublicSnapshot } from "@/lib/portfolio";
import dynamic from "next/dynamic";
import { Suspense, useCallback, useMemo } from "react";

const KeyCanvas = dynamic(
  () => import("@/components/key-stage").then((mod) => mod.KeyStage),
  { ssr: false, loading: () => <div className="studio-stage-slot" /> },
);

function kicker(locale: Locale) {
  return locale === "zh" ? "kicker-zh" : "kicker";
}

function statusCopy(pnl: number, t: Copy) {
  if (pnl < 0) return t.underCost;
  if (pnl > 0) return t.overCost;
  return t.vsCost;
}

export function StudioHero({
  snapshot,
  activeId,
  locale,
  t,
  onHover,
  onSelect,
}: {
  snapshot: PublicSnapshot;
  activeId: string | null;
  locale: Locale;
  t: Copy;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const asOf = formatLongDate(snapshot.asOf, locale);
  const currency = currencyForLocale(locale);
  const amount = useCallback(
    (usd: number) => toDisplayAmount(usd, currency, snapshot.fx),
    [currency, snapshot.fx],
  );
  const slices = useMemo(
    () => slicesFromSnapshot(snapshot, allocationValues(snapshot, amount)),
    [amount, snapshot],
  );
  const series = useMemo(() => seriesForChart(snapshot), [snapshot]);
  const activeHolding = snapshot.holdings.find((row) => row.symbol === activeId);
  const costBasis = snapshot.holdings.reduce((sum, row) => sum + row.costBasis, 0);
  const vsCost = costBasis > 0 ? snapshot.unrealizedPnl / costBasis : 0;
  const tone = pnlTone(snapshot.unrealizedPnl);
  const displayNav = amount(snapshot.nav);
  const displayPnl = amount(snapshot.unrealizedPnl);
  const activeAmount = activeHolding ? amount(activeHolding.marketValue) : 0;
  const rate = snapshot.fx?.usdCny;

  return (
    <section>
      <div className="studio-caption studio-summary">
        <p className={kicker(locale)}>{t.nav}</p>
        <h1 className="font-money mt-3 break-words text-[clamp(3rem,11vw,5.75rem)] leading-[0.88]">
          {formatMoney(displayNav, 2, currency)}
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {t.cashRule(rate != null ? rate.toFixed(4) : undefined)}
        </p>
        <p
          className={`status-chip ${
            tone === "up" ? "is-up text-[var(--up)]" : tone === "down" ? "text-[var(--down)]" : "is-flat"
          }`}
        >
          <span className="font-num">{formatSignedMoney(displayPnl, 2, currency)}</span>
          <span className="text-[var(--faint)]">·</span>
          <span className="font-num">{formatPct(vsCost)}</span>
          <span>{statusCopy(snapshot.unrealizedPnl, t)}</span>
        </p>
      </div>

      <div className="studio-frame">
        <Suspense fallback={<div className="studio-stage-slot" />}>
          {reduced ? (
            <div className="studio-stage-slot key-fallback">
              <KeySilhouette />
            </div>
          ) : (
            <KeyCanvas />
          )}
        </Suspense>
      </div>

      <div className="chart-board">
        <figure className="chart-panel">
          <p className={kicker(locale)}>{t.allocation}</p>
          <AllocationPie
            slices={slices}
            activeId={activeId}
            idleLabel={t.allocation}
            onHover={onHover}
            onSelect={onSelect}
            ariaLabel={t.allocation}
          />
        </figure>
        <figure className="chart-panel">
          <p className={kicker(locale)}>{t.navLine}</p>
          <NavLine
            series={series}
            amount={amount}
            currency={currency}
            locale={locale}
            navLabel={t.market}
            costLabel={t.costBasis}
            ariaLabel={t.navLine}
          />
        </figure>
      </div>
      <p className="chart-plate">
        {asOf}
        <span className="mx-2 text-[var(--faint)]">·</span>
        {t.delayedClose}
      </p>

      <div className="studio-caption studio-key">
        <p className="mb-5 min-h-6 max-w-xl text-sm leading-6 text-[var(--muted)]">
          {activeHolding
            ? `${activeHolding.symbol} · ${activeHolding.description} · ${t.shares(formatQty(activeHolding.quantity))} · ${formatMoney(activeAmount, 2, currency)} · ${formatWeight(activeHolding.weight)}`
            : t.inspectHint}
        </p>
        <StructureKey
          slices={slices}
          currency={currency}
          activeId={activeId}
          onHover={onHover}
          onSelect={onSelect}
        />
      </div>
    </section>
  );
}
