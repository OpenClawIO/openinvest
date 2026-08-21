export type Locale = "en" | "zh";

export const copy = {
  en: {
    brand: "OPENINVEST",
    tagline: "Public account",
    nav: "Net asset value",
    vsCost: "vs cost",
    inspectHint: "Drag the stacks. One coin is one gram at this page’s gold spot.",
    delayedClose: "Delayed close",
    underCost: "under cost",
    overCost: "over cost",
    dek: (count: number) =>
      `One personal Interactive Brokers account as a delayed close snapshot, counted in 1 g gold coins at the gold spot on this page. ${count === 1 ? "One name" : `${count} names`}. No live quotes.`,
    cash: "Cash",
    shares: (qty: string) => `${qty} sh`,
    allocation: "Gold mass",
    costToMarket: "Cost to market",
    costBasis: "Cost basis",
    market: "Market",
    positions: "Positions",
    listed: (count: number, cash: string) => `${count} listed · cash ${cash}`,
    activity: "Activity",
    noFills: (date: string) => `No fills on ${date}.`,
    buy: "BUY",
    sell: "SELL",
    cost: "cost",
    mark: "mark",
    goldMass: "Gold mass",
    coinRule: (price: string) => `1 coin = 1 g · ${price} / g`,
    footer: (statement?: string) =>
      `Personal holdings, not a recommendation. Interactive Brokers Flex snapshot, delayed, unaudited, unofficial. Gold grams use XAU/USD spot at page build, not an IBKR print. Market data may not be redistributed.${statement ? ` Statement ${statement}.` : ""}`,
    emptyTitle: "No snapshot yet",
    emptyBody: "Run npm run sync to pull the first Interactive Brokers Flex statement.",
  },
  zh: {
    brand: "OPENINVEST",
    tagline: "公开投资账户",
    nav: "净资产",
    vsCost: "相对成本",
    inspectHint: "拖动金币堆。一枚金币是一克，按本页黄金现价。",
    delayedClose: "延迟收盘",
    underCost: "低于成本",
    overCost: "高于成本",
    dek: (count: number) =>
      `个人盈透证券账户的日终快照，按本页黄金现价一枚金币一克来数。${count} 只标的。非实时行情。`,
    cash: "现金",
    shares: (qty: string) => `${qty} 股`,
    allocation: "黄金克重",
    costToMarket: "成本到市值",
    costBasis: "成本",
    market: "市值",
    positions: "持仓",
    listed: (count: number, cash: string) => `${count} 只 · 现金 ${cash}`,
    activity: "成交",
    noFills: (date: string) => `${date} 无成交。`,
    buy: "买入",
    sell: "卖出",
    cost: "成本",
    mark: "现价",
    goldMass: "黄金克重",
    coinRule: (price: string) => `1 枚 = 1 克 · ${price} / 克`,
    footer: (statement?: string) =>
      `个人持仓展示，不构成投资建议。数据来自盈透证券 Flex 日终报表，存在延迟，未经审计，非官方产品。克重按页面生成时的 XAU/USD 现价，不是盈透金价。市场数据不得再分发。${statement ? ` 报表 ${statement}。` : ""}`,
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

export function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  document.documentElement.dataset.locale = locale;
}

export function persistLocale(locale: Locale) {
  window.localStorage.setItem("openinvest.locale", locale);
  const url = new URL(window.location.href);
  url.searchParams.set("lang", locale);
  window.history.replaceState({}, "", url);
  applyDocumentLocale(locale);
}
