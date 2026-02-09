/**
 * @MODULE_ID app.zasterix-vault.dashboard
 * @STAGE admin
 * @DATA_INPUTS ["universal_history"]
 * @REQUIRED_TOOLS []
 */
import type { Database } from "@/core/types/database.types";
import { DynamicPayloadRenderer } from "@/shared/components/DynamicPayloadRenderer";

type UniversalHistoryRow =
  Database["public"]["Tables"]["universal_history"]["Row"];

type VaultDashboardProps = {
  initialHistory?: UniversalHistoryRow[];
  serverErrorMessage?: string | null;
  serverErrorDetails?: string | null;
};

const formatTimestamp = (value: string | null) => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const VaultDashboard = ({
  initialHistory = [],
  serverErrorMessage = null,
  serverErrorDetails = null,
}: VaultDashboardProps) => {
  const history = initialHistory ?? [];
  const hasError = Boolean(serverErrorMessage || serverErrorDetails);

  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
          Zasterix Vault
        </p>
        <h1 className="text-3xl font-semibold text-slate-100">
          Private Boardroom Feed
        </h1>
        <p className="text-sm text-slate-400">
          Live protocol stream from universal_history.
        </p>
      </header>

      {hasError ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <p>Verbindung zur Datenbank fehlgeschlagen.</p>
          {serverErrorMessage ? (
            <p className="mt-2 text-xs text-rose-200/80">
              {serverErrorMessage}
            </p>
          ) : null}
          {serverErrorDetails ? (
            <p className="mt-2 text-xs text-rose-200/70">
              {serverErrorDetails}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-4">
        {history.length === 0 ? (
          <p className="text-sm text-slate-400">Keine Einträge vorhanden.</p>
        ) : (
          history.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-4 text-sm text-slate-200"
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>{formatTimestamp(entry.created_at)}</span>
                <span>
                  {entry.summary_payload ? "Summary" : "Payload"}
                </span>
              </div>
              <div className="mt-3">
                <DynamicPayloadRenderer
                  payload={entry.summary_payload ?? entry.payload}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
