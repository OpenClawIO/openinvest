"use client";

import { LanguageSwitch } from "@/components/language-switch";
import { PriceRuler } from "@/components/measure-ruler";
import { StudioHero } from "@/components/studio-hero";
import { useLocale } from "@/components/locale-provider";
import {
  formatLongDate,
  formatMoney,
  formatPct,
  formatQty,
  formatSignedMoney,
  pnlTone,
} from "@/lib/format";
import { currencyForLocale, toDisplayAmount, type DisplayCurrency } from "@/lib/fx";
import type { Copy, Locale } from "@/lib/i18n";
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

  const asOf = formatLongDate(snapshot.asOf, locale);
  const currency = currencyForLocale(locale);

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
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className={kicker(locale)}>{t.positions}</h2>
            <p className="text-xs text-[var(--faint)]">
              {t.listed(
                snapshot.holdings.length,
                formatMoney(toDisplayAmount(snapshot.cash, currency, snapshot.fx), 2, currency),
              )}
            </p>
          </div>
          <div className="mt-2">
            {snapshot.holdings.map((row) => (
              <HoldingRow
                key={row.symbol}
                row={row}
                amount={toDisplayAmount(row.marketValue, currency, snapshot.fx)}
                total={toDisplayAmount(snapshot.nav, currency, snapshot.fx)}
                pnl={toDisplayAmount(row.unrealizedPnl, currency, snapshot.fx)}
                currency={currency}
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
            <p className="mt-4 text-sm text-[var(--muted)]">{t.noFills(asOf)}</p>
          ) : (
            <div className="mt-2">
              {snapshot.trades.map((trade, index) => (
                <div
                  key={`${trade.symbol}-${trade.date}-${index}`}
                  className="money-row"
                >
                  <div className="min-w-0">
                    <p className="ticker">{trade.symbol}</p>
                    <p className="mt-0.5 text-sm text-[var(--muted)]">
                      {trade.side === "BUY" ? t.buy : trade.side === "SELL" ? t.sell : trade.side}
                      <span className="mx-1.5 text-[var(--faint)]">·</span>
                      {formatLongDate(trade.date, locale)}
                    </p>
                  </div>
                  <p className="font-num shrink-0 text-[15px]">
                    {formatQty(trade.quantity)} @ {formatMoney(trade.tradePrice, 2, "USD")}
                  </p>
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
  amount,
  total,
  pnl,
  currency,
  active,
  onHover,
  onSelect,
  t,
}: {
  row: PublicHolding;
  amount: number;
  total: number;
  pnl: number;
  currency: DisplayCurrency;
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
      <div className="money-row">
        <div className="min-w-0">
          <p className="ticker text-[15px] sm:text-base">{row.symbol}</p>
          <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
            {row.description}
            <span className="mx-1.5 text-[var(--faint)]">·</span>
            {t.shares(formatQty(row.quantity))}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-num text-lg sm:text-xl">{formatMoney(amount, 2, currency)}</p>
          <p
            className={`mt-0.5 font-num text-sm ${
              tone === "down"
                ? "text-[var(--down)]"
                : tone === "up"
                  ? "text-[var(--up)]"
                  : "text-[var(--muted)]"
            }`}
          >
            {formatSignedMoney(pnl, 2, currency)}
            <span className="mx-1.5 text-[var(--faint)]">·</span>
            {formatPct(vsCost)}
          </p>
        </div>
      </div>
      <div className="holding-track hidden sm:block">
        <PriceRuler cost={row.averageCost} mark={row.markPrice} />
      </div>
      <div className="weight-rail" aria-label={formatMoney(amount, 0, currency)}>
        <span
          style={{
            width: `${Math.max(total > 0 ? (amount / total) * 100 : row.weight * 100, 1.5)}%`,
            background: currency === "CNY" ? "#8d1f2f" : "#1c5c3c",
          }}
        />
      </div>
    </article>
  );
}
