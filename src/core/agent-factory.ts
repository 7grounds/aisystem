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

export type SpecialistConsultation = {
  agentId: string;
  agentName: string;
  response: string;
  timestamp: string;
};

export type TechnicalTaskDispatch = {
  taskId: string;
  coordinatorId: string | null;
  task: string;
  createdAt: string;
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
  searchKeywords: string[];
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
      "id, name, description, system_prompt, organization_id, category, icon, search_keywords, created_at",
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

const buildSearchKeywords = ({
  task,
  name,
  description,
  category,
}: {
  task: string;
  name?: string;
  description?: string;
  category?: string | null;
}) => {
  const seed = [task, name, description, category]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9äöüß\s-]/gi, " ");

  const keywords = seed
    .split(/\s+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

  return Array.from(new Set(keywords));
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
  searchKeywords,
}: {
  task: string;
  name?: string;
  description?: string;
  systemPrompt?: string;
  organizationId?: string | null;
  category?: string | null;
  icon?: string | null;
  searchKeywords?: string[];
}) => {
  const trimmedTask = task.trim();
  const agentName = name?.trim() || trimmedTask || "Specialist Agent";
  const agentDescription =
    description?.trim() || `Spezial-Agent für ${trimmedTask || "Sonderfälle"}.`;
  const prompt = systemPrompt?.trim() || defaultTemplatePrompt(trimmedTask);
  const keywords =
    searchKeywords && searchKeywords.length > 0
      ? Array.from(new Set(searchKeywords))
      : buildSearchKeywords({
          task: trimmedTask,
          name: agentName,
          description: agentDescription,
          category,
        });

  const { data, error } = await supabase
    .from("agent_templates")
    .insert({
      name: agentName,
      description: agentDescription,
      system_prompt: prompt,
      organization_id: organizationId ?? null,
      category: category ?? "General",
      icon: icon ?? "🧠",
      search_keywords: keywords,
    })
    .select(
      "id, name, description, system_prompt, organization_id, category, icon, search_keywords, created_at",
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
    searchKeywords: row.search_keywords ?? [],
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
  searchKeywords,
}: {
  name: string;
  description: string;
  systemPrompt: string;
  organizationId?: string | null;
  category?: string | null;
  icon?: string | null;
  searchKeywords?: string[];
}) => {
  let query = supabase
    .from("agent_templates")
    .select(
      "id, name, description, system_prompt, organization_id, category, icon, search_keywords, created_at",
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
    searchKeywords,
  });

  return { data: data as AgentTemplateRow | null, created: true, error };
};

export const consultSpecialistAgent = async (
  agentId: string,
  context: string,
) => {
  const { data, error } = await supabase
    .from("agent_templates")
    .select("id, name, system_prompt")
    .eq("id", agentId)
    .maybeSingle();

  if (error || !data) {
    return {
      data: null,
      error: error ?? new Error("Agent not found"),
    };
  }

  const response = [
    `Agent ${data.name} consulted.`,
    `Context received: ${context}`,
    "Response: Provide targeted guidance based on the specialist prompt.",
  ].join("\n");

  return {
    data: {
      agentId: data.id,
      agentName: data.name,
      response,
      timestamp: new Date().toISOString(),
    } as SpecialistConsultation,
    error: null,
  };
};

export const dispatchTechnicalTask = async ({
  coordinatorId,
  userId,
  organizationId,
  task,
}: {
  coordinatorId?: string | null;
  userId: string;
  organizationId: string | null;
  task: string;
}) => {
  const payload = {
    type: "dev_task",
    coordinator_id: coordinatorId ?? null,
    task,
  };

  const { data, error } = await supabase
    .from("universal_history")
    .insert({
      user_id: userId,
      organization_id: organizationId,
      payload,
      created_at: new Date().toISOString(),
    })
    .select("id, created_at")
    .single();

  if (error || !data) {
    return { data: null, error };
  }

  return {
    data: {
      taskId: data.id,
      coordinatorId: coordinatorId ?? null,
      task,
      createdAt: data.created_at ?? new Date().toISOString(),
    } as TechnicalTaskDispatch,
    error: null,
  };
};

type ConversationEntry = {
  role: "system" | "user" | "assistant";
  content: string;
};

export const consolidateConversation = async ({
  userId,
  organizationId,
  payload,
  summary,
}: {
  userId: string;
  organizationId: string | null;
  payload: ConversationEntry[];
  summary: string[];
}) => {
  return supabase.from("universal_history").insert({
    user_id: userId,
    organization_id: organizationId,
    payload,
    summary_payload: {
      key_takeaways: summary,
      generated_at: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
  });
};
