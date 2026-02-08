/**
 * @MODULE_ID core.progress
 * @STAGE global
 * @DATA_INPUTS ["user_id", "stage_id", "module_id", "task_id"]
 * @REQUIRED_TOOLS ["supabase"]
 */
import { supabase } from "@/core/supabase";

export type ProgressRecord = {
  stageId: string;
  moduleId: string;
  completedTasks: string[];
  updatedAt: string | null;
};

export const fetchUserProgress = async (
  userId: string,
): Promise<ProgressRecord | null> => {
  const { data, error } = await supabase
    .from("user_progress")
    .select("stage_id, module_id, completed_tasks, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    stageId: data.stage_id ?? "",
    moduleId: data.module_id ?? "",
    completedTasks: data.completed_tasks ?? [],
    updatedAt: data.updated_at ?? null,
  };
};

export const updateTaskProgress = async (
  userId: string,
  stageId: string,
  moduleId: string,
  taskId: string,
) => {
  const { data } = await supabase
    .from("user_progress")
    .select("completed_tasks")
    .eq("user_id", userId)
    .eq("stage_id", stageId)
    .eq("module_id", moduleId)
    .limit(1)
    .maybeSingle();

  const existingTasks = data?.completed_tasks ?? [];
  const completedTasks = Array.from(new Set([...existingTasks, taskId]));

  return supabase.from("user_progress").upsert(
    {
      user_id: userId,
      stage_id: stageId,
      module_id: moduleId,
      completed_tasks: completedTasks,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,stage_id,module_id",
    },
  );
};

export const resetAllProgress = async (userId: string) => {
  return supabase.from("user_progress").delete().eq("user_id", userId);
};
