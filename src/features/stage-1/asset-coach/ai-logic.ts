/**
 * @MODULE_ID stage-1.asset-coach.ai-logic
 * @STAGE stage-1
 * @DATA_INPUTS ["assetLabel", "isin"]
 * @REQUIRED_TOOLS ["IsinAnalyzer"]
 */
import type { AssetProfile } from "@/shared/tools/IsinAnalyzer";
import { lookupAsset } from "@/shared/tools/IsinAnalyzer";

const formatAssetLabel = (assetLabel: string) => {
  const cleaned = assetLabel.trim();
  return cleaned.length > 0 ? cleaned : "the asset";
};

export const generateSwissWealthAnalysis = (assetLabel: string) => {
  const label = formatAssetLabel(assetLabel);

  return [
    `Assessment for ${label}: This asset is evaluated through a Swiss wealth engineering lens with focus on capital preservation, liquidity discipline, and strategic diversification.`,
    "Risk posture: Validate volatility, drawdown history, and correlation against CHF-denominated benchmarks. Stress-test for macro rate shifts and franc strength.",
    "Portfolio fit: Target balance across liquid core, growth satellites, and defensive hedges. Avoid concentration risk above policy limits.",
    "Fee alert: A 0.95% advisory fee materially impacts compounding over time. Confirm expected net return exceeds fee drag before allocation.",
  ].join("\n\n");
};

export const generateAssetCoachPrompt = async (
  assetInput: string,
  basePrompt?: string,
  assetHint?: AssetProfile | null,
) => {
  const resolvedAsset = assetHint ?? (await lookupAsset(assetInput));
  const hardContext = resolvedAsset
    ? `Hard Context: ${resolvedAsset.name} (${resolvedAsset.symbol}) is a ${resolvedAsset.type} in ${resolvedAsset.currency}.`
    : "Hard Context: Asset lookup not found. Treat as unknown.";
  const label = formatAssetLabel(assetInput);
  const prompt = [
    hardContext,
    `User input: ${label}.`,
    basePrompt ??
      "Provide a Swiss wealth engineering assessment with risk posture, diversification fit, and fee sensitivity.",
  ].join("\n\n");

  return {
    prompt,
    hardContext,
    asset: resolvedAsset,
  };
};
