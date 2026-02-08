export type TaskType = "info" | "input" | "ai-coach" | "tool-action";

export type TaskBase = {
  id: string;
  type: TaskType;
  title: string;
  description?: string;
};

export type InfoTask = TaskBase & {
  type: "info";
  content: string;
};

export type InputTask = TaskBase & {
  type: "input";
  placeholder?: string;
  inputLabel?: string;
};

export type AICoachTask = TaskBase & {
  type: "ai-coach";
  prompt: string;
};

export type YuhConnectorTask = TaskBase & {
  type: "tool-action";
  toolId: "yuh-connector";
  actionLabel: string;
  action: "connect" | "transfer" | "portfolio";
  amount?: number;
  currency?: string;
};

export type FeeCalculatorTask = TaskBase & {
  type: "tool-action";
  toolId: "fee-calculator";
};

export type ToolActionTask = YuhConnectorTask | FeeCalculatorTask;

export type TaskDefinition = InfoTask | InputTask | AICoachTask | ToolActionTask;
