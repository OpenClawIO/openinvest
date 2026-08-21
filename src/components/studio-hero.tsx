"use client";

import { StructureBars } from "@/components/structure-bars";
import { StructureKey } from "@/components/structure-key";
import { ValueRuler } from "@/components/measure-ruler";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
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
import type { PublicSnapshot } from "@/lib/portfolio";
import { volumesFromHoldings } from "@/lib/studio";
import dynamic from "next/dynamic";
import { Suspense, useMemo } from "react";

const StudioCanvas = dynamic(
  () => import("@/components/studio-stage").then((mod) => mod.StudioStage),
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
  const volumes = useMemo(() => volumesFromHoldings(snapshot.holdings), [snapshot.holdings]);
  const asOf = formatLongDate(snapshot.asOf, locale);
  const activeHolding = snapshot.holdings.find((row) => row.symbol === activeId);
  const costBasis = snapshot.holdings.reduce((sum, row) => sum + row.costBasis, 0);
  const vsCost = costBasis > 0 ? snapshot.unrealizedPnl / costBasis : 0;
  const tone = pnlTone(snapshot.unrealizedPnl);

  return (
    <section>
      <div className="studio-caption studio-summary">
        <p className={kicker(locale)}>{t.nav}</p>
        <h1 className="font-money mt-3 break-words text-[clamp(3rem,11vw,5.75rem)] leading-[0.88]">
          {formatMoney(snapshot.nav)}
        </h1>
        <p
          className={`status-chip ${
            tone === "up" ? "is-up text-[var(--up)]" : tone === "down" ? "text-[var(--down)]" : "is-flat"
          }`}
        >
          <span className="font-num">{formatSignedMoney(snapshot.unrealizedPnl)}</span>
          <span className="text-[var(--faint)]">·</span>
          <span className="font-num">{formatPct(vsCost)}</span>
          <span>{statusCopy(snapshot.unrealizedPnl, t)}</span>
        </p>
        <ValueRuler
          cost={costBasis}
          market={snapshot.nav}
          pnl={snapshot.unrealizedPnl}
          locale={locale}
          t={t}
        />
      </div>

      <div className="studio-frame">
        <Suspense fallback={<div className="studio-stage-slot" />}>
          {reduced ? (
            <StructureBars
              volumes={volumes}
              activeId={activeId}
              onHover={onHover}
              onSelect={onSelect}
              ariaLabel={t.allocation}
            />
          ) : (
            <StudioCanvas
              volumes={volumes}
              activeId={activeId}
              onHover={onHover}
              onSelect={onSelect}
            />
          )}
        </Suspense>
        <p className="studio-plate">
          {asOf}
          <span className="mx-2 text-[var(--faint)]">·</span>
          {t.delayedClose}
        </p>
      </div>

      <div className="studio-caption studio-key">
        <p className="mb-5 min-h-6 max-w-xl text-sm leading-6 text-[var(--muted)]">
          {activeHolding
            ? `${activeHolding.symbol} · ${activeHolding.description} · ${t.shares(formatQty(activeHolding.quantity))} · ${formatWeight(activeHolding.weight)}`
            : t.inspectHint}
        </p>
        <StructureKey
          holdings={snapshot.holdings}
          activeId={activeId}
          onHover={onHover}
          onSelect={onSelect}
        />
      </div>
    </section>
  );
}
