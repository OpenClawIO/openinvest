import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { PublicSnapshot } from "@/lib/portfolio";

export function loadSnapshot(): PublicSnapshot | null {
  const path = join(process.cwd(), "data", "public.json");
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as PublicSnapshot;
}
