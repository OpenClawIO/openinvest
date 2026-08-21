export type DisplayCurrency = "USD" | "CNY";

export type FxQuote = {
  usdCny: number;
  quotedAt: string;
  source: string;
};

export function currencyForLocale(locale: "en" | "zh"): DisplayCurrency {
  return locale === "zh" ? "CNY" : "USD";
}

export function toDisplayAmount(usd: number, currency: DisplayCurrency, fx?: FxQuote | null) {
  if (currency === "USD") return usd;
  const rate = fx?.usdCny ?? 0;
  return rate > 0 ? usd * rate : 0;
}
