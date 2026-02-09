/**
 * @MODULE_ID app.zasterix-vault
 * @STAGE admin
 * @DATA_INPUTS ["universal_history"]
 * @REQUIRED_TOOLS ["supabase"]
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/core/types/database.types";
import { VaultDashboard } from "./VaultDashboard";

export const dynamic = 'force-dynamic';

export default async function VaultPage() {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  let history: Database["public"]["Tables"]["universal_history"]["Row"][] = [];
  let serverErrorMessage: string | null = null;
  let serverErrorDetails: string | null = null;

  if (!supabaseUrl || !supabaseKey) {
    serverErrorMessage = "Supabase server credentials missing.";
    console.error("Vault server env missing:", {
      hasServerUrl: Boolean(supabaseUrl),
      hasServerKey: Boolean(supabaseKey),
    });
  } else {
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("universal_history")
      .select("id, payload, summary_payload, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Vault server fetch failed:", error);
      serverErrorMessage = error.message;
      serverErrorDetails = [
        error.code ? `code: ${error.code}` : null,
        error.details ? `details: ${error.details}` : null,
        error.hint ? `hint: ${error.hint}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
    } else {
      history = data ?? [];
    }
  }

  return (
    <VaultDashboard
      initialHistory={history}
      serverErrorMessage={serverErrorMessage}
      serverErrorDetails={serverErrorDetails}
    />
  );
}
