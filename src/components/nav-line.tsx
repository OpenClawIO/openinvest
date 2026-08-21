"use client";

import { layoutLine } from "@/lib/chart-model";
import { formatAxisDate, formatMoney, pnlTone } from "@/lib/format";
import type { DisplayCurrency } from "@/lib/fx";
import type { Locale } from "@/lib/i18n";
import type { EquityPoint } from "@/lib/portfolio";
import { useMemo, useState } from "react";

export function NavLine({
  series,
  amount,
  currency,
  locale,
  navLabel,
  costLabel,
  ariaLabel,
}: {
  series: EquityPoint[];
  amount: (usd: number) => number;
  currency: DisplayCurrency;
  locale: Locale;
  navLabel: string;
  costLabel: string;
  ariaLabel: string;
}) {
  const layout = useMemo(() => layoutLine(series, amount), [amount, series]);
  const [hoverAsOf, setHoverAsOf] = useState<string | null>(null);
  const last = layout.points.at(-1);
  const active =
    layout.points.find((point) => point.asOf === hoverAsOf) ?? last ?? null;
  const tone = active ? pnlTone(active.nav - active.costBasis) : "flat";
  const band =
    tone === "up" ? "rgba(0, 204, 75, 0.16)" : tone === "down" ? "rgba(255, 68, 51, 0.16)" : "rgba(255,255,255,0.08)";
  const stroke = tone === "up" ? "var(--up)" : tone === "down" ? "var(--down)" : "var(--text)";

  return (
    <div className="line-stage">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label={ariaLabel}
        className="nav-line-plot"
        onMouseLeave={() => setHoverAsOf(null)}
      >
        {layout.yTicks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={layout.inner.left}
              x2={layout.inner.right}
              y1={tick.y}
              y2={tick.y}
              stroke="var(--line)"
              strokeWidth="1"
            />
            <text
              x={layout.inner.left - 8}
              y={tick.y}
              textAnchor="end"
              dominantBaseline="middle"
              className="chart-axis"
            >
              {formatMoney(tick.value, 0, currency)}
            </text>
          </g>
        ))}
        {layout.bandPath ? <path d={layout.bandPath} fill={band} /> : null}
        <path
          d={layout.costPath}
          fill="none"
          stroke="var(--faint)"
          strokeWidth="1.5"
          strokeDasharray="5 5"
        />
        <path
          d={layout.navPath}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {layout.points.map((point) => {
          const isActive = active?.asOf === point.asOf;
          return (
            <g key={point.asOf}>
              <circle
                cx={point.x}
                cy={point.yCost}
                r={3}
                fill="var(--bg)"
                stroke="var(--faint)"
                strokeWidth="1.5"
              />
              <circle
                cx={point.x}
                cy={point.yNav}
                r={isActive ? 5.5 : 4}
                fill={stroke}
                stroke="var(--bg)"
                strokeWidth="2"
              />
              <rect
                x={point.x - 18}
                y={layout.inner.top}
                width="36"
                height={layout.inner.bottom - layout.inner.top}
                fill="transparent"
                onMouseEnter={() => setHoverAsOf(point.asOf)}
              />
              <text
                x={point.x}
                y={layout.height - 10}
                textAnchor="middle"
                className="chart-axis"
              >
                {formatAxisDate(point.asOf, locale)}
              </text>
            </g>
          );
        })}
        {active ? (
          <text
            x={active.x > layout.width * 0.72 ? active.x - 10 : active.x + 10}
            y={active.yNav - 12}
            textAnchor={active.x > layout.width * 0.72 ? "end" : "start"}
            className="chart-callout"
          >
            {formatMoney(active.nav, 0, currency)}
          </text>
        ) : null}
      </svg>
      <p className="chart-legend">
          <span>
            <span className="chart-swatch is-nav" style={{ background: stroke }} />
            {navLabel}
          </span>
          <span>
            <span className="chart-swatch is-cost" />
            {costLabel}
          </span>
      </p>
    </div>
  );
}
