import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFlexXml } from "../src/lib/flex";
import { withFxQuote } from "./with-fx";
import { withSeries } from "./with-series";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = join(root, "data", "raw");
const latest = readdirSync(rawDir)
  .filter((name) => name.endsWith(".xml"))
  .sort()
  .at(-1);

if (!latest) {
  throw new Error("No Flex XML in data/raw. Run npm run sync first.");
}

const publicPath = join(root, "data", "public.json");
const snapshot = withSeries(
  await withFxQuote(parseFlexXml(readFileSync(join(rawDir, latest), "utf8"))),
  publicPath,
);
writeFileSync(publicPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(
  `Rebuilt ${latest}: ${snapshot.holdings.length} holdings, NAV ${snapshot.nav.toFixed(2)} as of ${snapshot.asOf}${snapshot.fx ? `, USD/CNY ${snapshot.fx.usdCny.toFixed(4)}` : ""}${snapshot.series ? `, ${snapshot.series.length} statement points` : ""}.`,
);
