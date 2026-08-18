export type Locale = "en" | "zh";

export const copy = {
  en: {
    brand: "OPENINVEST",
    tagline: "Public book",
    nav: "Net asset value",
    vsCost: "vs cost",
    dek: (count: number) =>
      `One personal Interactive Brokers account, published as a delayed close snapshot. ${count === 1 ? "One name" : `${count} names`}. No live quotes.`,
    names: (count: number) => (count === 1 ? "name" : "names"),
    cash: "Cash",
    shares: (qty: string) => `${qty} sh`,
    allocation: "Portfolio allocation",
    costToMarket: "Cost to market",
    costBasis: "Cost basis",
    market: "Market",
    positions: "Positions",
    listed: (count: number, cash: string) => `${count} listed · cash ${cash}`,
    activity: "Activity",
    noFills: (date: string) => `No fills on ${date}. Last business day only.`,
    buy: "BUY",
    sell: "SELL",
    cost: "cost",
    mark: "mark",
    footer: (statement?: string) =>
      `Personal holdings, not a recommendation. Interactive Brokers Flex snapshot, delayed, unaudited, unofficial. Market data may not be redistributed.${statement ? ` Statement ${statement}.` : ""}`,
    emptyTitle: "No snapshot yet",
    emptyBody: "Run npm run sync to pull the first Interactive Brokers Flex statement.",
  },
  zh: {
    brand: "OPENINVEST",
    tagline: "公开投资账户",
    nav: "净资产",
    vsCost: "相对成本",
    dek: (count: number) =>
      `个人盈透证券账户的日终快照。${count} 只标的。非实时行情。`,
    names: (_count: number) => "标的",
    cash: "现金",
    shares: (qty: string) => `${qty} 股`,
    allocation: "资产配置",
    costToMarket: "成本到市值",
    costBasis: "成本",
    market: "市值",
    positions: "持仓",
    listed: (count: number, cash: string) => `${count} 只 · 现金 ${cash}`,
    activity: "成交",
    noFills: (date: string) => `${date} 无成交。仅覆盖上一交易日。`,
    buy: "买入",
    sell: "卖出",
    cost: "成本",
    mark: "现价",
    footer: (statement?: string) =>
      `个人持仓展示，不构成投资建议。数据来自盈透证券 Flex 日终报表，存在延迟，未经审计，非官方产品。市场数据不得再分发。${statement ? ` 报表 ${statement}。` : ""}`,
    emptyTitle: "还没有快照",
    emptyBody: "运行 npm run sync，拉取第一份盈透 Flex 报表。",
  },
} as const;

export type Copy = (typeof copy)[Locale];

export function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("lang");
  if (fromQuery === "zh" || fromQuery === "en") return fromQuery;
  const stored = window.localStorage.getItem("openinvest.locale");
  if (stored === "zh" || stored === "en") return stored;
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function persistLocale(locale: Locale) {
  window.localStorage.setItem("openinvest.locale", locale);
  const url = new URL(window.location.href);
  url.searchParams.set("lang", locale);
  window.history.replaceState({}, "", url);
  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
}
