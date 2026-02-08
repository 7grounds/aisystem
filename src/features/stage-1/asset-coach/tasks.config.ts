import type { TaskDefinition } from "@/shared/tools/taskSchema";

export const assetCoachTasks: TaskDefinition[] = [
  {
    id: "identify-asset",
    type: "input",
    title: "Identify Asset",
    description: "Enter the asset name or ISIN to initiate analysis.",
    inputLabel: "Asset name or ISIN",
    placeholder: "Nestle SA or CH0038863350",
  },
  {
    id: "ai-engineering-check",
    type: "ai-coach",
    title: "AI-Engineering Check",
    description:
      "Review the AI-generated Swiss wealth analysis before proceeding.",
    prompt:
      "Analyze the asset with Swiss wealth engineering standards, highlight risk posture, and confirm fee impact.",
  },
  {
    id: "yuh-integration",
    type: "tool-action",
    title: "Yuh Integration",
    description: "Finalize the step by connecting the asset inside Yuh.",
    toolId: "yuh-connector",
    actionLabel: "Finalize in Yuh",
    action: "connect",
  },
];
