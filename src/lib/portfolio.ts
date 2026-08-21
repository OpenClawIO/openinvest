import type { FxQuote } from "./fx";

export type PublicHolding = {
  symbol: string;
  description: string;
  assetClass: string;
  exchange: string;
  quantity: number;
  markPrice: number;
  averageCost: number;
  costBasis: number;
  marketValue: number;
  unrealizedPnl: number;
  weight: number;
  currency: string;
};

export type PublicTrade = {
  date: string;
  symbol: string;
  side: "BUY" | "SELL" | "UNKNOWN";
  quantity: number;
  tradePrice: number;
  proceeds: number;
  currency: string;
};

export type EquityPoint = {
  asOf: string;
  nav: number;
  costBasis: number;
};

export type PublicSnapshot = {
  asOf: string;
  generatedAt: string;
  baseCurrency: string;
  nav: number;
  cash: number;
  unrealizedPnl: number;
  holdings: PublicHolding[];
  trades: PublicTrade[];
  fx?: FxQuote;
  series?: EquityPoint[];
};
