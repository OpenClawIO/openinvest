import { changeFromGrams, gramsFromUsd, type CoinPiece } from "@/lib/gold";
import type { PublicSnapshot } from "@/lib/portfolio";

export type CoinStack = {
  id: string;
  label: string;
  grams: number;
  pieces: CoinPiece[];
};

export function stacksFromSnapshot(snapshot: PublicSnapshot): CoinStack[] {
  const usdPerGram = snapshot.gold?.usdPerGram ?? 0;
  return snapshot.holdings
    .map((holding) => {
      const grams = gramsFromUsd(holding.marketValue, usdPerGram);
      return {
        id: holding.symbol,
        label: holding.symbol,
        grams,
        pieces: changeFromGrams(grams),
      };
    })
    .filter((stack) => stack.pieces.length > 0);
}

export function totalGrams(snapshot: PublicSnapshot) {
  return gramsFromUsd(snapshot.nav, snapshot.gold?.usdPerGram ?? 0);
}
