import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { usdPerGramFromOunce, type GoldQuote } from "../src/lib/gold";
import type { PublicSnapshot } from "../src/lib/portfolio";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicPath = join(root, "data", "public.json");
const GOLD_URL = "https://api.gold-api.com/price/XAU";

type GoldApiPayload = {
  price?: number;
  updatedAt?: string;
};

export async function withGoldQuote(snapshot: PublicSnapshot): Promise<PublicSnapshot> {
  try {
    return { ...snapshot, gold: await fetchGoldQuote() };
  } catch (error) {
    const previous = readPreviousGold();
    if (previous) {
      console.warn(`Gold spot unavailable, keeping ${previous.quotedAt}.`);
      return { ...snapshot, gold: previous };
    }
    throw error;
  }
}

async function fetchGoldQuote(): Promise<GoldQuote> {
  const response = await fetch(GOLD_URL, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Gold quote failed: ${response.status}`);
  }
  const payload = (await response.json()) as GoldApiPayload;
  const usdPerTroyOunce = Number(payload.price);
  if (!Number.isFinite(usdPerTroyOunce) || usdPerTroyOunce <= 0) {
    throw new Error("Gold quote missing a usable XAU/USD price");
  }
  return {
    usdPerTroyOunce,
    usdPerGram: usdPerGramFromOunce(usdPerTroyOunce),
    quotedAt: payload.updatedAt || new Date().toISOString(),
    source: "gold-api.com XAU/USD spot",
  };
}

function readPreviousGold(): GoldQuote | null {
  if (!existsSync(publicPath)) return null;
  try {
    const previous = JSON.parse(readFileSync(publicPath, "utf8")) as PublicSnapshot;
    return previous.gold ?? null;
  } catch {
    return null;
  }
}
