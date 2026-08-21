import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { FxQuote } from "../src/lib/fx";
import type { PublicSnapshot } from "../src/lib/portfolio";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicPath = join(root, "data", "public.json");
const FRANKFURTER = "https://api.frankfurter.app/latest?from=USD&to=CNY";
const FALLBACK = "https://open.er-api.com/v6/latest/USD";

export async function withFxQuote(snapshot: PublicSnapshot): Promise<PublicSnapshot> {
  const rest = { ...snapshot } as PublicSnapshot & { gold?: unknown };
  delete rest.gold;
  try {
    return { ...rest, fx: await fetchFxQuote() };
  } catch (error) {
    const previous = readPreviousFx();
    if (previous) {
      console.warn(`USD/CNY unavailable, keeping ${previous.quotedAt}.`);
      return { ...rest, fx: previous };
    }
    throw error;
  }
}

async function fetchFxQuote(): Promise<FxQuote> {
  try {
    const response = await fetch(FRANKFURTER, { headers: { accept: "application/json" } });
    if (response.ok) {
      const payload = (await response.json()) as { rates?: { CNY?: number }; date?: string };
      const usdCny = Number(payload.rates?.CNY);
      if (usdCny > 0) {
        return {
          usdCny,
          quotedAt: payload.date ? `${payload.date}T00:00:00Z` : new Date().toISOString(),
          source: "frankfurter.app USD/CNY",
        };
      }
    }
  } catch {
    // try fallback
  }

  const response = await fetch(FALLBACK, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`FX quote failed: ${response.status}`);
  }
  const payload = (await response.json()) as {
    rates?: { CNY?: number };
    time_last_update_utc?: string;
  };
  const usdCny = Number(payload.rates?.CNY);
  if (!(usdCny > 0)) {
    throw new Error("FX quote missing USD/CNY");
  }
  return {
    usdCny,
    quotedAt: payload.time_last_update_utc || new Date().toISOString(),
    source: "open.er-api.com USD/CNY",
  };
}

function readPreviousFx(): FxQuote | null {
  if (!existsSync(publicPath)) return null;
  try {
    const previous = JSON.parse(readFileSync(publicPath, "utf8")) as PublicSnapshot;
    return previous.fx ?? null;
  } catch {
    return null;
  }
}
