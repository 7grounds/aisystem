/**
 * @MODULE_ID core.governance
 * @STAGE global
 * @DATA_INPUTS ["executive_approval"]
 * @REQUIRED_TOOLS []
 */
import { supabase } from "@/core/supabase";

export const EXECUTIVE_APPROVAL_TOKEN = "CHECK-OK";

type RegistrarContext = {
  userId?: string | null;
  organizationId?: string | null;
  decisions?: string[];
  openTasks?: string[];
  flowStatus?: string | null;
  source?: string;
};

const resolveUserContext = async (context?: RegistrarContext) => {
  if (context?.userId) {
    return {
      userId: context.userId,
      organizationId: context.organizationId ?? null,
    };
  }

  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? null;
  if (!userId) {
    return { userId: null, organizationId: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();

  return {
    userId,
    organizationId: profile?.organization_id ?? null,
  };
};

const logRegistrarEntry = async ({
  userId,
  organizationId,
  decisions,
  openTasks,
  flowStatus,
  source,
}: {
  userId: string;
  organizationId: string | null;
  decisions: string[];
  openTasks: string[];
  flowStatus: string | null;
  source?: string;
}) => {
  await supabase.from("universal_history").insert({
    user_id: userId,
    organization_id: organizationId,
    payload: {
      type: "registrar_log",
      decisions,
      open_tasks: openTasks,
      flow_status: flowStatus,
      source: source ?? null,
    },
    created_at: new Date().toISOString(),
  });
};

export const assertExecutiveApproval = async (
  token?: string | null,
  context?: RegistrarContext,
) => {
  if (token !== EXECUTIVE_APPROVAL_TOKEN) {
    throw new Error("Executive approval missing.");
  }

  const resolved = await resolveUserContext(context);
  if (!resolved.userId) return;

  await logRegistrarEntry({
    userId: resolved.userId,
    organizationId: resolved.organizationId,
    decisions: context?.decisions ?? ["Executive approval granted."],
    openTasks: context?.openTasks ?? [],
    flowStatus: context?.flowStatus ?? "approved",
    source: context?.source,
  });
};
