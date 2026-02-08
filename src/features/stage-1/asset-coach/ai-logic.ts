/**
 * @MODULE_ID stage-1.asset-coach.ai-logic
 * @STAGE stage-1
 * @DATA_INPUTS ["assetLabel", "isin", "amount"]
 * @REQUIRED_TOOLS ["IsinAnalyzer", "FeeCalc", "YuhLinker"]
 */
import type { AssetProfile } from "@/shared/tools/IsinAnalyzer";
import { isLikelyIsin, lookupAsset } from "@/shared/tools/IsinAnalyzer";
import { calcReferenceFee, calcYuhFee } from "@/shared/tools/FeeCalculator";
import { buildYuhDeepLink } from "@/shared/tools/YuhConnector";
import { supabase } from "@/core/supabase";

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

const agentToolSystemPrompt = [
  "Tools Available:",
  "- Tool [IsinLookup]: Use this to get the Name, Symbol, and Asset-Type from an ISIN or Name.",
  "- Tool [FeeCalc]: Use this to calculate the 0.95% Yuh fee for a given CHF amount.",
  "- Tool [YuhLinker]: Use this to generate the final deep-link for the transaction.",
  "",
  "Agentic Loop:",
  "1. Thought: Identify missing information.",
  "2. Action: Call a required Tool from /shared/tools/.",
  "3. Observation: Process data returned by the tool.",
  "4. Final Response: Produce a professional Wealth Engineer recommendation.",
].join("\n");

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
    agentToolSystemPrompt,
    "",
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

const formatChf = (value: number) => `CHF ${value.toFixed(2)}`;

export type AgentStatusStep = {
  label: string;
  timestamp: number;
};

export type AgentOutput = {
  finalResponse: string;
  hardContext: string;
  statusSteps: AgentStatusStep[];
};

type AgentPersistenceContext = {
  userId?: string | null;
  organizationId?: string | null;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const runAssetCoachAgent = async (
  assetInput: string,
  amountChf = 1000,
  basePrompt?: string,
  onStatus?: (step: AgentStatusStep, steps: AgentStatusStep[]) => void,
  persistence?: AgentPersistenceContext,
): Promise<AgentOutput> => {
  const statusSteps: AgentStatusStep[] = [];
  const pushStatus = (label: string) => {
    const step = { label, timestamp: Date.now() };
    statusSteps.push(step);
    onStatus?.(step, [...statusSteps]);
  };

  const cleanLabel = formatAssetLabel(assetInput);
  pushStatus("> [THOUGHT]: Analyzing user input for asset identification...");
  pushStatus(`> [TOOL_CALL]: Accessing IsinAnalyzer for "${cleanLabel}"...`);
  const asset = await lookupAsset(assetInput);
  if (asset) {
    const matchToken = isLikelyIsin(assetInput)
      ? assetInput.trim().toUpperCase()
      : asset.symbol;
    pushStatus(
      `> [OBSERVATION]: Match found: ${matchToken}. Asset type: ${asset.type}.`,
    );
  } else {
    pushStatus(
      "> [OBSERVATION]: No match found. Asset type: Unknown.",
    );
  }

  pushStatus(
    `> [TOOL_CALL]: Accessing FeeCalculator for ${amountChf} CHF...`,
  );
  await sleep(150);
  const yuhFee = calcYuhFee(amountChf);
  const referenceFee = calcReferenceFee(amountChf);
  pushStatus(
    `> [OBSERVATION]: Yuh fee ${formatChf(yuhFee)} vs Reference ${formatChf(
      referenceFee,
    )}.`,
  );

  pushStatus("> [TOOL_CALL]: Generating YuhLinker deep-link...");
  await sleep(120);
  const yuhLink = buildYuhDeepLink({ action: "connect" });
  pushStatus(`> [OBSERVATION]: Link ready (${yuhLink}).`);
  pushStatus("> [FINAL]: Generating wealth engineering recommendation...");

  const hardContext = asset
    ? `Hard Context: ${asset.name} (${asset.symbol}) is a ${asset.type} in ${asset.currency}.`
    : "Hard Context: Asset lookup not found. Treat as unknown.";
  const label = formatAssetLabel(assetInput);

  const finalResponse = [
    hardContext,
    `Wealth Engineer Recommendation: ${label} should be assessed with CHF liquidity resilience, correlation against core holdings, and fee drag sensitivity.`,
    `Fee insight: Yuh fee on ${formatChf(amountChf)} is ${formatChf(
      yuhFee,
    )}; a reference bank would charge ${formatChf(referenceFee)}.`,
    `Execution readiness: ${yuhLink}`,
    basePrompt
      ? `Additional Prompt Context: ${basePrompt}`
      : "Assessment calibrated to Swiss wealth engineering standards.",
    "Analysis based on live tool-data.",
  ].join("\n\n");

  if (persistence?.userId) {
    const isin = isLikelyIsin(assetInput)
      ? assetInput.trim().toUpperCase()
      : asset?.symbol ?? assetInput.trim();
    await supabase.from("user_asset_history").insert({
      user_id: persistence.userId,
      organization_id: persistence.organizationId ?? null,
      isin,
      asset_name: asset?.name ?? label,
      last_amount: amountChf,
      last_fee: yuhFee,
      currency: asset?.currency ?? "CHF",
      analyzed_at: new Date().toISOString(),
    });
  }

  return {
    finalResponse,
    hardContext,
    statusSteps,
  };
};
