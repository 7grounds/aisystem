/**
 * @MODULE_ID core.progress
 * @STAGE global
 * @DATA_INPUTS ["user_id"]
 * @REQUIRED_TOOLS ["supabase"]
 */
import { supabase } from "@/core/supabase";

type LatestProgress = {
  stageId: string | null;
  moduleId: string | null;
  completedTasks: string[] | null;
};

export const getLatestProgress = async (
  userId: string,
): Promise<LatestProgress> => {
  const { data, error } = await supabase
    .from("user_progress")
    .select("stage_id, module_id, completed_tasks")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return {
      stageId: null,
      moduleId: null,
      completedTasks: null,
    };
  }

  return {
    stageId: data.stage_id ?? null,
    moduleId: data.module_id ?? null,
    completedTasks: data.completed_tasks ?? null,
  };
};
