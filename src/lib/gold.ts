export const TROY_OUNCE_GRAMS = 31.1034768;
export const COIN_DENOMS = [10, 5, 2, 1] as const;

export type CoinDenom = (typeof COIN_DENOMS)[number];

export type GoldQuote = {
  usdPerTroyOunce: number;
  usdPerGram: number;
  quotedAt: string;
  source: string;
};

export type CoinPiece = {
  denom: CoinDenom;
  fill: number;
};

export function usdPerGramFromOunce(usdPerTroyOunce: number) {
  return usdPerTroyOunce / TROY_OUNCE_GRAMS;
}

export function gramsFromUsd(usd: number, usdPerGram: number) {
  if (!(usdPerGram > 0)) return 0;
  return usd / usdPerGram;
}

export function changeFromGrams(grams: number): CoinPiece[] {
  const pieces: CoinPiece[] = [];
  let rest = Math.max(0, grams);
  for (const denom of COIN_DENOMS) {
    const count = Math.floor(rest / denom + 1e-9);
    for (let i = 0; i < count; i += 1) {
      pieces.push({ denom, fill: 1 });
      rest -= denom;
    }
  }
  if (rest >= 0.05) {
    pieces.push({ denom: 1, fill: rest });
  }
  return pieces;
}
