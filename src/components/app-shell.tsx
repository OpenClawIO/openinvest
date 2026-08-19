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
  const { locale, t } = useLocale();
  return (
    <main className="page-shell mx-auto max-w-xl">
      <div className="flex items-center justify-between gap-3">
        <p className="brand-mark text-[11px] text-[var(--text)]">{t.brand}</p>
        <LanguageSwitch />
      </div>
      <h1
        className={`mt-8 sm:mt-10 ${
          locale === "zh"
            ? "font-display-zh text-[clamp(2.2rem,8vw,3rem)]"
            : "font-display text-[clamp(2.4rem,10vw,3.5rem)] sm:text-5xl"
        }`}
      >
        {t.emptyTitle}
      </h1>
      <p className="dek mt-4">{t.emptyBody}</p>
    </main>
  );
}
