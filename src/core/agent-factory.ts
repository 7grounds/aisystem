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

type AgentTemplateRow =
  Database["public"]["Tables"]["agent_templates"]["Row"];

export type AgentTemplate = {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  organizationId: string | null;
  category: string | null;
  icon: string | null;
  createdAt: string | null;
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

export const fetchAgentTemplates = async (
  organizationId?: string | null,
) => {
  let query = supabase
    .from("agent_templates")
    .select(
      "id, name, description, system_prompt, organization_id, category, icon, created_at",
    )
    .order("created_at", { ascending: false });

  if (organizationId) {
    query = query.or(
      `organization_id.eq.${organizationId},organization_id.is.null`,
    );
  }

  const { data, error } = await query;

  return {
    data: (data ?? []) as AgentTemplateRow[],
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

const defaultTemplatePrompt = (task: string) => {
  return [
    "You are a specialized financial AI built for Zasterix.",
    `Mission: ${task}.`,
    "Operate in a Swiss wealth engineering tone with compliance and precision.",
    "If critical data is missing, ask for it before making recommendations.",
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

export const createSpecialistAgent = async ({
  task,
  name,
  description,
  systemPrompt,
  organizationId,
  category,
  icon,
}: {
  task: string;
  name?: string;
  description?: string;
  systemPrompt?: string;
  organizationId?: string | null;
  category?: string | null;
  icon?: string | null;
}) => {
  const trimmedTask = task.trim();
  const agentName = name?.trim() || trimmedTask || "Specialist Agent";
  const agentDescription =
    description?.trim() || `Spezial-Agent für ${trimmedTask || "Sonderfälle"}.`;
  const prompt = systemPrompt?.trim() || defaultTemplatePrompt(trimmedTask);

  const { data, error } = await supabase
    .from("agent_templates")
    .insert({
      name: agentName,
      description: agentDescription,
      system_prompt: prompt,
      organization_id: organizationId ?? null,
      category: category ?? "General",
      icon: icon ?? "🧠",
    })
    .select(
      "id, name, description, system_prompt, organization_id, category, icon, created_at",
    )
    .single();

  return {
    data: data as AgentTemplateRow | null,
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

export const instantiateTemplates = (
  rows: AgentTemplateRow[],
): AgentTemplate[] => {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    systemPrompt: row.system_prompt,
    organizationId: row.organization_id ?? null,
    category: row.category ?? null,
    icon: row.icon ?? null,
    createdAt: row.created_at,
  }));
};

export const registerNewAgent = async ({
  name,
  description,
  systemPrompt,
  organizationId,
  category,
  icon,
}: {
  name: string;
  description: string;
  systemPrompt: string;
  organizationId?: string | null;
  category?: string | null;
  icon?: string | null;
}) => {
  let query = supabase
    .from("agent_templates")
    .select(
      "id, name, description, system_prompt, organization_id, category, icon, created_at",
    )
    .eq("name", name)
    .limit(1);

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  } else {
    query = query.is("organization_id", null);
  }

  const { data: existing, error: existingError } = await query.maybeSingle();
  if (existingError) {
    return { data: null, created: false, error: existingError };
  }

  if (existing) {
    return { data: existing as AgentTemplateRow, created: false, error: null };
  }

  const { data, error } = await createSpecialistAgent({
    task: name,
    name,
    description,
    systemPrompt,
    organizationId,
    category,
    icon,
  });

  return { data: data as AgentTemplateRow | null, created: true, error };
};
