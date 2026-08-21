import { existsSync, readFileSync } from "node:fs";
import { mergeSeries } from "../src/lib/equity";
import type { PublicSnapshot } from "../src/lib/portfolio";

export function withSeries(snapshot: PublicSnapshot, publicPath: string): PublicSnapshot {
  let previous: PublicSnapshot["series"];
  if (existsSync(publicPath)) {
    try {
      previous = (JSON.parse(readFileSync(publicPath, "utf8")) as PublicSnapshot).series;
    } catch {
      previous = undefined;
    }
  }
  return { ...snapshot, series: mergeSeries(previous, snapshot) };
}
