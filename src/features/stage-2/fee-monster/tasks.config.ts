import type { TaskDefinition } from "@/shared/tools/taskSchema";

export const feeMonsterTasks: TaskDefinition[] = [
  {
    id: "education",
    type: "info",
    title: "Fee Reality Check",
    description: "Understand the 0.95% fee and the 1 CHF minimum.",
    content:
      "Yuh applies a 0.95% transaction fee with a minimum charge of 1 CHF. Traditional banks often run 1.5% - 2.5% fees plus additional custody costs, which compounds into a heavier drag on returns.",
  },
  {
    id: "calculation",
    type: "tool-action",
    title: "Fee Calculator",
    description: "Compare Yuh vs. Big Bank fees on a live amount.",
    toolId: "fee-calculator",
  },
  {
    id: "optimization",
    type: "ai-coach",
    title: "Order Sizing Optimization",
    description: "See why consolidating orders reduces fee friction.",
    prompt:
      "Explain why investing 100 CHF at once can be more efficient than four separate 25 CHF orders due to the 1 CHF minimum fee.",
  },
];
