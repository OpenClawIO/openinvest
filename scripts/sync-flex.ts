import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { parseFlexXml } from "../src/lib/flex";
import { withFxQuote } from "./with-fx";
import { withSeries } from "./with-series";

const execFileAsync = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  version: string;
};
const USER_AGENT = `OpenInvest/${pkg.version} (Node.js)`;
loadEnvLocal(join(root, ".env.local"));

const SEND_URL =
  "https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService/SendRequest";
const GET_URL =
  "https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService/GetStatement";

async function main() {
  const token = required("IBKR_FLEX_TOKEN");
  const queryId = process.env.IBKR_FLEX_QUERY_ID?.trim();
  if (!queryId) {
    throw new Error(
      "Missing IBKR_FLEX_QUERY_ID. In Client Portal open Performance & Reports → Flex Queries and copy the Query ID (not the token) into .env.local.",
    );
  }

  const reference = await sendRequest(token, queryId);
  const xml = await getStatement(token, reference);
  const snapshot = withSeries(await withFxQuote(parseFlexXml(xml)), join(root, "data", "public.json"));

  const rawDir = join(root, "data", "raw");
  mkdirSync(rawDir, { recursive: true });
  writeFileSync(join(rawDir, `${snapshot.asOf.replaceAll("-", "")}.xml`), xml);
  writeFileSync(
    join(root, "data", "public.json"),
    `${JSON.stringify(snapshot, null, 2)}\n`,
  );

  console.log(
    `Synced ${snapshot.holdings.length} holdings, NAV ${snapshot.nav.toFixed(2)} ${snapshot.baseCurrency}, as of ${snapshot.asOf}${snapshot.fx ? `, USD/CNY ${snapshot.fx.usdCny.toFixed(4)}` : ""}.`,
  );
}

async function sendRequest(token: string, queryId: string): Promise<string> {
  const url = new URL(SEND_URL);
  url.searchParams.set("t", token);
  url.searchParams.set("q", queryId);
  url.searchParams.set("v", "3");
  const xml = await fetchText(url);
  const reference = xml.match(/<ReferenceCode>([^<]+)<\/ReferenceCode>/i)?.[1];
  const status = xml.match(/<Status>([^<]+)<\/Status>/i)?.[1];
  if (status && status.toLowerCase() !== "success") {
    const message =
      xml.match(/<ErrorMessage>([^<]+)<\/ErrorMessage>/i)?.[1] ?? xml;
    throw new Error(`SendRequest failed: ${message}`);
  }
  if (!reference) {
    throw new Error("SendRequest did not return a ReferenceCode");
  }
  return reference;
}

async function getStatement(token: string, reference: string): Promise<string> {
  const url = new URL(GET_URL);
  url.searchParams.set("t", token);
  url.searchParams.set("q", reference);
  url.searchParams.set("v", "3");

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const xml = await fetchText(url);
    const generating =
      /ErrorCode>1019/i.test(xml) ||
      /statement generation in progress/i.test(xml);
    if (!generating) return xml;
    await sleep(2000 * (attempt + 1));
  }
  throw new Error("Timed out waiting for Flex statement");
}

async function fetchText(url: URL): Promise<string> {
  try {
    const { stdout } = await execFileAsync(
      "curl",
      [
        "-sS",
        "-f",
        "--connect-timeout",
        "30",
        "--max-time",
        "90",
        "-A",
        USER_AGENT,
        url.toString(),
      ],
      { maxBuffer: 20 * 1024 * 1024 },
    );
    return stdout;
  } catch {
    throw new Error(`Network error talking to ${url.origin}${url.pathname}`);
  }
}

function loadEnvLocal(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] == null) process.env[key] = value;
  }
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} in .env.local`);
  }
  return value;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
