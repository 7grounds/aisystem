/**
 * @MODULE_ID shared.tools.isin-analyzer
 * @STAGE global
 * @DATA_INPUTS ["isin_or_symbol"]
 * @REQUIRED_TOOLS []
 */
export type AssetType = "Stock" | "Crypto" | "ETF";
export type AssetCurrency = "CHF" | "USD";

export type AssetProfile = {
  name: string;
  symbol: string;
  type: AssetType;
  currency: AssetCurrency;
};

type AssetRecord = AssetProfile & {
  isin?: string;
  aliases?: string[];
};

const MOCK_ASSETS: AssetRecord[] = [
  {
    name: "Nestlé SA",
    symbol: "NESN",
    type: "Stock",
    currency: "CHF",
    isin: "CH0038863350",
    aliases: ["nestle", "nestlé"],
  },
  {
    name: "Roche Holding AG",
    symbol: "ROG",
    type: "Stock",
    currency: "CHF",
    isin: "CH0012032048",
    aliases: ["roche"],
  },
  {
    name: "Apple Inc.",
    symbol: "AAPL",
    type: "Stock",
    currency: "USD",
    isin: "US0378331005",
    aliases: ["apple"],
  },
  {
    name: "Bitcoin",
    symbol: "BTC",
    type: "Crypto",
    currency: "USD",
    aliases: ["bitcoin"],
  },
  {
    name: "S&P 500 ETF",
    symbol: "SPY",
    type: "ETF",
    currency: "USD",
    isin: "US78462F1030",
    aliases: ["s&p 500", "sp500", "s&p500"],
  },
];

const normalizeQuery = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, "");

export const isLikelyIsin = (value: string) => {
  return /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(value.trim().toUpperCase());
};

export const lookupAsset = async (
  query: string,
): Promise<AssetProfile | null> => {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return null;
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  const upperQuery = query.trim().toUpperCase();
  const match =
    MOCK_ASSETS.find((asset) => asset.isin?.toUpperCase() === upperQuery) ??
    MOCK_ASSETS.find((asset) => asset.symbol.toUpperCase() === upperQuery) ??
    MOCK_ASSETS.find((asset) =>
      normalizeQuery(asset.name) === normalized ||
      asset.aliases?.some((alias) => normalizeQuery(alias) === normalized),
    );

  if (!match) {
    return null;
  }

  return {
    name: match.name,
    symbol: match.symbol,
    type: match.type,
    currency: match.currency,
  };
};
