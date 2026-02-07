import type { TaskDefinition } from "@/shared/tools/taskSchema";

export const assetIdentificationTasks: TaskDefinition[] = [
  {
    id: "stage-intro",
    type: "info",
    title: "Stage Brief",
    description: "Map the full picture before the strategy layer.",
    content:
      "Capture a complete snapshot of your assets so the AI coach can build a balanced wealth plan tailored to Yuh.",
  },
  {
    id: "asset-categories",
    type: "input",
    title: "Primary Asset Categories",
    description: "List key buckets like cash, investments, real estate.",
    inputLabel: "Your asset categories",
    placeholder: "Cash, ETFs, real estate, private equity",
  },
  {
    id: "asset-value",
    type: "input",
    title: "Investable Asset Estimate",
    description: "Provide a high-level estimate to anchor strategy.",
    inputLabel: "Estimated total value (CHF)",
    placeholder: "CHF 250,000",
  },
  {
    id: "connect-yuh",
    type: "tool-action",
    title: "Connect Yuh",
    description: "Securely bring your Yuh accounts into view.",
    toolId: "yuh-connector",
    actionLabel: "Link Yuh Account",
    action: "connect",
  },
  {
    id: "ai-coach",
    type: "ai-coach",
    title: "AI Coach Signal",
    description: "Let the coach confirm any missing details.",
    prompt:
      "Summarize the asset profile above and ask for any missing allocations or liabilities.",
  },
];
