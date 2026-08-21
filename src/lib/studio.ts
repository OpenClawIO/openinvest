import { coinsFromGrams, gramsFromUsd } from "@/lib/gold";
import type { PublicSnapshot } from "@/lib/portfolio";

export type CoinStack = {
  id: string;
  label: string;
  grams: number;
  coins: number;
  remainder: number;
};

export function stacksFromSnapshot(snapshot: PublicSnapshot): CoinStack[] {
  const usdPerGram = snapshot.gold?.usdPerGram ?? 0;
  return snapshot.holdings
    .map((holding) => {
      const { full, remainder, grams } = coinsFromGrams(
        gramsFromUsd(holding.marketValue, usdPerGram),
      );
      return {
        id: holding.symbol,
        label: holding.symbol,
        grams,
        coins: full,
        remainder,
      };
    })
    .filter((stack) => stack.grams >= 0.05);
}

export function totalGrams(snapshot: PublicSnapshot) {
  return gramsFromUsd(snapshot.nav, snapshot.gold?.usdPerGram ?? 0);
}
