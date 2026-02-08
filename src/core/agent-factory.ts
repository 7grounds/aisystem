/**
 * @MODULE_ID core.agent-factory
 * @STAGE global
 * @DATA_INPUTS ["agent_definitions"]
 * @REQUIRED_TOOLS ["supabase"]
 */
import type { Database } from "@/core/types/database.types";
import { supabase } from "@/core/supabase";

type AgentDefinitionRow =
  Database["public"]["Tables"]["agent_definitions"]["Row"];

export type AgentInstance = {
  id: string;
  name: string;
  systemPrompt: string;
  icon: string | null;
  status: string | null;
};

export const fetchAgentDefinitions = async () => {
  const { data, error } = await supabase
    .from("agent_definitions")
    .select("id, name, system_prompt, icon, status, created_at")
    .order("created_at", { ascending: false });

  return {
    data: (data ?? []) as AgentDefinitionRow[],
    error,
  };
};

const defaultSystemPrompt = (task: string) => {
  return [
    "You are a specialist AI agent within Zasterix.",
    `Primary task: ${task}.`,
    "Work in a Swiss wealth engineering tone and focus on precision, compliance, and actionability.",
    "If data is missing, ask for it succinctly before proceeding.",
  ].join("\n");
};

export const createAgentDefinition = async ({
  task,
  name,
  icon,
  status = "active",
  systemPrompt,
}: {
  task: string;
  name?: string;
  icon?: string;
  status?: string;
  systemPrompt?: string;
}) => {
  const trimmedTask = task.trim();
  const agentName = name?.trim() || trimmedTask || "Special Agent";
  const prompt = systemPrompt?.trim() || defaultSystemPrompt(trimmedTask);

  const { data, error } = await supabase
    .from("agent_definitions")
    .insert({
      name: agentName,
      system_prompt: prompt,
      icon: icon ?? "🧠",
      status,
    })
    .select("id, name, system_prompt, icon, status, created_at")
    .single();

  return {
    data: data as AgentDefinitionRow | null,
    error,
  };
};

export const instantiateAgents = (rows: AgentDefinitionRow[]): AgentInstance[] => {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    systemPrompt: row.system_prompt,
    icon: row.icon,
    status: row.status,
  }));
};
