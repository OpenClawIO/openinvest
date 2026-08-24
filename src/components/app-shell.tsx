"use client";

import { CompanyLockup } from "@/components/company-lockup";
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
    <main className="page-shell mx-auto max-w-xl">
      <div className="flex items-center justify-between gap-3">
        <CompanyLockup t={t} />
        <LanguageSwitch />
      </div>
      <h1 className="font-money mt-8 text-[clamp(2.2rem,8vw,3.25rem)] leading-[0.95] sm:mt-10">
        {t.emptyTitle}
      </h1>
      <p className="dek mt-4">{t.emptyBody}</p>
    </main>
  );
}
