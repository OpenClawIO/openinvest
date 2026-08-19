"use client";

import { LanguageSwitch } from "@/components/language-switch";
import { PriceRuler, ValueRuler } from "@/components/measure-ruler";
import { StudioHero } from "@/components/studio-hero";
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
import { colorForIndex } from "@/lib/palette";
import { APP_VERSION } from "@/lib/version";
import type { PublicHolding, PublicSnapshot } from "@/lib/portfolio";
import { useState } from "react";

function kicker(locale: Locale) {
  return locale === "zh" ? "kicker-zh" : "kicker";
}

export function PortfolioView({ snapshot }: { snapshot: PublicSnapshot }) {
  const { locale, t } = useLocale();
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const activeId = hoverId ?? pinnedId;

  const costBasis = snapshot.holdings.reduce((sum, row) => sum + row.costBasis, 0);
  const asOf = formatLongDate(snapshot.asOf, locale);

  const select = (id: string) => {
    setPinnedId((current) => {
      const next = current === id ? null : id;
      if (next) {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        requestAnimationFrame(() => {
          document.getElementById(`holding-${next}`)?.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "nearest",
          });
        });
      }
      return next;
    });
  };

  return (
    <div className="studio-page">
      <header className="studio-bar">
        <div className="min-w-0">
          <p className="brand-mark text-[10px] text-[var(--text)] sm:text-[11px]">{t.brand}</p>
          <p className="mt-1 hidden text-sm text-[var(--muted)] sm:block">{t.tagline}</p>
        </div>
        <div className="flex shrink-0 items-baseline gap-4 sm:gap-5">
          <p className="hidden font-num text-xs text-[var(--muted)] sm:block">
            {asOf} · T+1
          </p>
          <LanguageSwitch />
        </div>
      </header>

      <StudioHero
        snapshot={snapshot}
        activeId={activeId}
        locale={locale}
        t={t}
        onHover={setHoverId}
        onSelect={select}
      />

      <main className="ledger">
        <p className="dek">{t.dek(snapshot.holdings.length)}</p>

        <section className="mt-12 sm:mt-16">
          <h2 className={kicker(locale)}>{t.costToMarket}</h2>
          <ValueRuler
            cost={costBasis}
            market={snapshot.nav}
            pnl={snapshot.unrealizedPnl}
            locale={locale}
            t={t}
          />
        </section>

        <section className="mt-12 sm:mt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className={kicker(locale)}>{t.positions}</h2>
            <p className="text-xs text-[var(--faint)]">
              {t.listed(snapshot.holdings.length, formatMoney(snapshot.cash))}
            </p>
          </div>
          <div className="mt-4">
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
          </div>
        </section>

        <section className="mt-12 sm:mt-16">
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
                    {trade.side === "BUY" ? t.buy : trade.side === "SELL" ? t.sell : trade.side}
                  </span>
                  <span className="ticker">{trade.symbol}</span>
                  <span className="font-num sm:text-right">
                    {formatQty(trade.quantity)} @ {formatMoney(trade.tradePrice)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="fine-print mt-14 max-w-3xl sm:mt-20">
          {t.footer(
            snapshot.generatedAt ? snapshot.generatedAt.replace("T", " ") : undefined,
          )}{" "}
          <span className="font-num">OpenInvest v{APP_VERSION}</span>
        </footer>
      </main>
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
  const tone = pnlTone(row.unrealizedPnl);

  return (
    <article
      id={`holding-${row.symbol}`}
      className={`holding-row ${active ? "is-active" : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onMouseEnter={() => onHover(row.symbol)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(row.symbol)}
      onBlur={() => onHover(null)}
      onClick={() => onSelect(row.symbol)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(row.symbol);
        }
      }}
    >
      <div className="holding-grid">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 sm:gap-3">
            <span className="holding-swatch" style={{ background: color }} />
            <span className="ticker text-base sm:text-lg">{row.symbol}</span>
            <span className="text-[11px] text-[var(--faint)] sm:text-xs">{row.exchange}</span>
          </div>
          <p className="mt-1 truncate text-sm text-[var(--muted)]">{row.description}</p>
          <p className="mt-2 hidden font-num text-xs text-[var(--faint)] sm:block">
            {t.shares(formatQty(row.quantity))}
          </p>
        </div>
        <div className="hidden sm:block">
          <PriceRuler cost={row.averageCost} mark={row.markPrice} t={t} />
        </div>
        <div className="text-right">
          <div className="font-num text-[15px] sm:text-base">{formatMoney(row.marketValue)}</div>
          <div
            className={`mt-1 font-num text-xs sm:text-sm ${
              tone === "down"
                ? "text-[var(--down)]"
                : tone === "up"
                  ? "text-[var(--up)]"
                  : "text-[var(--muted)]"
            }`}
          >
            {formatSignedMoney(row.unrealizedPnl)} · {formatPct(vsCost)}
          </div>
          <div className="mt-1 font-num text-xs text-[var(--faint)]">{formatWeight(row.weight)}</div>
        </div>
        <p className="col-span-2 font-num text-xs text-[var(--faint)] sm:hidden">
          {t.shares(formatQty(row.quantity))} · {formatMoney(row.averageCost)} →{" "}
          {formatMoney(row.markPrice)}
        </p>
      </div>
    </article>
  );
}
