"use client";

import { StructureBars } from "@/components/structure-bars";
import { StructureKey } from "@/components/structure-key";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { formatLongDate, formatMoney, formatQty, formatWeight } from "@/lib/format";
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

  return (
    <section>
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

      <div className="studio-caption">
        <StructureKey
          holdings={snapshot.holdings}
          activeId={activeId}
          onHover={onHover}
          onSelect={onSelect}
        />
        <p className={`mt-8 ${kicker(locale)}`}>{t.nav}</p>
        <h1 className="font-display mt-3 break-words text-[clamp(2.6rem,9vw,4.75rem)] leading-[0.92]">
          {formatMoney(snapshot.nav)}
        </h1>
        <p className="mt-5 min-h-10 max-w-xl text-sm leading-6 text-[var(--muted)]">
          {activeHolding
            ? `${activeHolding.symbol} · ${activeHolding.description} · ${t.shares(formatQty(activeHolding.quantity))} · ${formatWeight(activeHolding.weight)}`
            : t.inspectHint}
        </p>
      </div>
    </section>
  );
}
