"use client";

import { LanguageSwitch } from "@/components/language-switch";
import { useLocale } from "@/components/locale-provider";
import { PortfolioView } from "@/components/portfolio-view";
import type { PublicSnapshot } from "@/lib/portfolio";

export function AppShell({ snapshot }: { snapshot: PublicSnapshot | null }) {
  if (!snapshot) return <EmptyState />;
  return <PortfolioView snapshot={snapshot} />;
}

function EmptyState() {
  const { t } = useLocale();
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <div className="glass flex items-center justify-between rounded-[22px] px-5 py-4">
        <p className="text-[11px] tracking-[0.28em] text-[var(--copper)]">{t.brand}</p>
        <LanguageSwitch />
      </div>
      <h1 className="font-display mt-10 text-5xl">{t.emptyTitle}</h1>
      <p className="mt-4 text-[15px] leading-7 text-[var(--muted)]">{t.emptyBody}</p>
    </main>
  );
}
