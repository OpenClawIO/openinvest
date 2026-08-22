import { XMLParser } from "fast-xml-parser";
import type { EquityPoint, PublicHolding, PublicSnapshot, PublicTrade } from "./portfolio";

type AttrMap = Record<string, unknown>;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  allowBooleanAttributes: true,
  parseAttributeValue: false,
  trimValues: true,
});

export function parseFlexXml(xml: string): PublicSnapshot {
  const doc = parser.parse(xml) as AttrMap;
  failIfFlexError(doc);

  const statements = list(
    walk(doc, ["FlexQueryResponse", "FlexStatements", "FlexStatement"]),
  );
  const statement = statements.reduce<AttrMap | undefined>((latest, row) => {
    if (!latest) return row;
    return statementDate(row) > statementDate(latest) ? row : latest;
  }, undefined);
  if (!statement) {
    throw new Error("Flex XML did not contain a FlexStatement");
  }

  const whenGenerated = formatFlexDateTime(str(statement, "whenGenerated"));
  const asOf = statementDate(statement) || whenGenerated.slice(0, 10) || new Date().toISOString().slice(0, 10);

  const holdings = collect(statement, "OpenPositions", "OpenPosition")
    .map(toHolding)
    .filter((row) => row.symbol.length > 0)
    .sort((a, b) => b.marketValue - a.marketValue);

  const trades = collect(statement, "Trades", "Trade")
    .map(toTrade)
    .filter((row) => row.symbol.length > 0);

  const equityRows = statements.flatMap((row) =>
    collect(row, "EquitySummaryInBase", "EquitySummaryByReportDateInBase"),
  );
  const latestEquity =
    equityRows.find((row) => formatFlexDate(str(row, "reportDate")) === asOf) ??
    equityRows.at(-1) ??
    first(equityRows);
  const changeNav = first(
    collect(statement, "ChangeInNAV", "ChangeInNAV"),
  );

  const cash = num(latestEquity, "cash");
  const nav =
    num(latestEquity, "total") ||
    num(changeNav, "endingValue") ||
    holdings.reduce((sum, row) => sum + row.marketValue, 0) + cash;

  const withWeights = holdings.map((row) => ({
    ...row,
    weight: nav > 0 ? row.marketValue / nav : 0,
  }));

  return {
    asOf,
    generatedAt: whenGenerated || new Date().toISOString(),
    baseCurrency: str(statement, "currency") || "USD",
    nav,
    cash,
    unrealizedPnl: withWeights.reduce((sum, row) => sum + row.unrealizedPnl, 0),
    holdings: withWeights,
    trades,
    series: seriesFromEquity(equityRows),
  };
}

function toHolding(row: AttrMap): PublicHolding {
  const quantity = num(row, "position") || num(row, "quantity");
  const marketValue = num(row, "positionValue");
  const costBasis = num(row, "costBasisMoney");
  const averageCost =
    num(row, "costBasisPrice") || (quantity !== 0 ? costBasis / quantity : 0);
  const unrealizedPnl =
    num(row, "fifoPnlUnrealized") || marketValue - costBasis;
  const percent = num(row, "percentOfNAV");
  return {
    symbol: str(row, "symbol"),
    description: str(row, "description"),
    assetClass: str(row, "assetCategory") || str(row, "assetClass"),
    exchange: str(row, "listingExchange"),
    quantity,
    markPrice: num(row, "markPrice"),
    averageCost,
    costBasis,
    marketValue,
    unrealizedPnl,
    weight: percent ? percent / 100 : 0,
    currency: str(row, "currency") || "USD",
  };
}

function toTrade(row: AttrMap): PublicTrade {
  const buySell = str(row, "buySell").toUpperCase();
  const side =
    buySell === "BUY" || buySell === "SELL"
      ? (buySell as "BUY" | "SELL")
      : "UNKNOWN";
  return {
    date: str(row, "tradeDate") || str(row, "dateTime") || str(row, "reportDate"),
    symbol: str(row, "symbol"),
    side,
    quantity: Math.abs(num(row, "quantity")),
    tradePrice: num(row, "tradePrice"),
    proceeds: num(row, "proceeds") || num(row, "netCash"),
    currency: str(row, "currency") || "USD",
  };
}

function failIfFlexError(doc: AttrMap) {
  const response = asRecord(doc.FlexStatementResponse);
  if (!response) return;
  const status = str(response, "Status");
  if (status.toLowerCase() === "success") return;
  const code = str(response, "ErrorCode");
  const message = str(response, "ErrorMessage") || "Flex request failed";
  throw new Error(code ? `${code}: ${message}` : message);
}

function collect(node: AttrMap, parent: string, child: string): AttrMap[] {
  const section = asRecord(node[parent]);
  if (!section) return [];
  const value = section[child];
  if (Array.isArray(value)) return value.map(asRecord).filter(Boolean) as AttrMap[];
  const one = asRecord(value);
  return one ? [one] : [];
}

function walk(node: unknown, path: string[]): unknown {
  let current: unknown = node;
  for (const key of path) {
    const record = asRecord(current);
    if (!record) return undefined;
    current = record[key];
  }
  return current;
}

function seriesFromEquity(rows: AttrMap[]): EquityPoint[] {
  const byDate = new Map<string, EquityPoint>();
  for (const row of rows) {
    const asOf = formatFlexDate(str(row, "reportDate"));
    const nav = num(row, "total");
    if (!asOf || !nav) continue;
    byDate.set(asOf, { asOf, nav, costBasis: 0 });
  }
  return [...byDate.values()].sort((a, b) => a.asOf.localeCompare(b.asOf));
}

function statementDate(statement: AttrMap): string {
  return formatFlexDate(
    str(statement, "toDate") || str(statement, "fromDate"),
  );
}

function list(value: unknown): AttrMap[] {
  if (Array.isArray(value)) return value.map(asRecord).filter(Boolean) as AttrMap[];
  const one = asRecord(value);
  return one ? [one] : [];
}

function first(value: unknown): AttrMap | undefined {
  return list(value)[0];
}

function asRecord(value: unknown): AttrMap | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as AttrMap;
  }
  return undefined;
}

function str(row: AttrMap | undefined, key: string): string {
  const value = row?.[key];
  return value == null ? "" : String(value).trim();
}

function num(row: AttrMap | undefined, key: string): number {
  const raw = str(row, key);
  if (!raw) return 0;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function formatFlexDate(raw: string): string {
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  return raw;
}

function formatFlexDateTime(raw: string): string {
  const match = raw.match(/^(\d{8});(\d{6})$/);
  if (!match) return formatFlexDate(raw);
  const [, day, time] = match;
  return `${formatFlexDate(day)}T${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`;
}
