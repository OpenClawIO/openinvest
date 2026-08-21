export const TROY_OUNCE_GRAMS = 31.1034768;

export type GoldQuote = {
  usdPerTroyOunce: number;
  usdPerGram: number;
  quotedAt: string;
  source: string;
};

export function usdPerGramFromOunce(usdPerTroyOunce: number) {
  return usdPerTroyOunce / TROY_OUNCE_GRAMS;
}

export function gramsFromUsd(usd: number, usdPerGram: number) {
  if (!(usdPerGram > 0)) return 0;
  return usd / usdPerGram;
}

export function coinsFromGrams(grams: number) {
  const full = Math.max(0, Math.floor(grams + 1e-9));
  const remainder = Math.max(0, grams - full);
  return { full, remainder, grams };
}
