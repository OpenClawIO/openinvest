import { packAmount, type CashPiece } from "@/lib/cash";
import { currencyForLocale, toDisplayAmount, type DisplayCurrency } from "@/lib/fx";
import type { Locale } from "@/lib/i18n";
import type { PublicSnapshot } from "@/lib/portfolio";

export type CashStack = {
  id: string;
  label: string;
  amount: number;
  pieces: CashPiece[];
};

export function stacksFromSnapshot(
  snapshot: PublicSnapshot,
  locale: Locale,
): { currency: DisplayCurrency; stacks: CashStack[] } {
  const currency = currencyForLocale(locale);
  const stacks = snapshot.holdings
    .map((holding) => {
      const amount = toDisplayAmount(holding.marketValue, currency, snapshot.fx);
      return {
        id: holding.symbol,
        label: holding.symbol,
        amount,
        pieces: packAmount(amount),
      };
    })
    .filter((stack) => stack.pieces.length > 0);
  return { currency, stacks };
}
