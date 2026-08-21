export const CASH_DENOMS = [100, 50, 20, 10, 5, 1] as const;

export type CashDenom = (typeof CASH_DENOMS)[number];
export type CashKind = "note" | "strap10" | "strap100";

export type CashPiece = {
  denom: CashDenom;
  kind: CashKind;
};

export function packAmount(amount: number): CashPiece[] {
  const pieces: CashPiece[] = [];
  let rest = Math.max(0, Math.floor(amount + 1e-6));
  for (const denom of CASH_DENOMS) {
    let count = Math.floor(rest / denom);
    rest -= count * denom;
    while (count >= 100) {
      pieces.push({ denom, kind: "strap100" });
      count -= 100;
    }
    while (count >= 10) {
      pieces.push({ denom, kind: "strap10" });
      count -= 10;
    }
    while (count > 0) {
      pieces.push({ denom, kind: "note" });
      count -= 1;
    }
  }
  return pieces;
}
