import type { DisplayCurrency } from "./fx";

export function formatMoney(
  value: number | null | undefined,
  digits = 2,
  currency: DisplayCurrency = "USD",
) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(currency === "CNY" ? "zh-CN" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatSignedMoney(
  value: number,
  digits = 2,
  currency: DisplayCurrency = "USD",
) {
  const formatted = formatMoney(Math.abs(value), digits, currency);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `−${formatted}`;
  return formatted;
}

export function formatQty(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  }).format(value);
}

export function formatPct(value: number, digits = 1) {
  const abs = `${(Math.abs(value) * 100).toFixed(digits)}%`;
  if (value > 0) return `+${abs}`;
  if (value < 0) return `−${abs}`;
  return abs;
}

export function formatWeight(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatGrams(value: number) {
  const digits = value >= 10 ? 1 : 2;
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)} g`;
}

export function formatLongDate(isoDate: string, locale: "en" | "zh" = "en") {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-GB", {
    day: "numeric",
    month: locale === "zh" ? "long" : "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function pnlTone(value: number): "up" | "down" | "flat" {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}
