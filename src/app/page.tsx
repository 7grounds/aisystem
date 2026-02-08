/**
 * @MODULE_ID app.home
 * @STAGE stage-1
 * @DATA_INPUTS ["activeModule", "progressSnapshot"]
 * @REQUIRED_TOOLS ["YuhConnector", "getButtonClasses"]
 */
import Link from "next/link";
import { getButtonClasses } from "@/shared/components/Button";
import { YuhConnector } from "@/shared/tools/YuhConnector";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-slate-950 px-8 py-10 text-slate-100 shadow-[0_25px_60px_rgba(15,23,42,0.4)]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
            Active Module
          </p>
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold">
              Stage 1: Asset-Coach
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
              AI-powered asset diagnostics built for Swiss wealth engineering.
              Run a precision check before an asset is admitted into the Yuh
              portfolio workflow.
            </p>
          </div>
          <div className="pt-2">
            <Link
              className={getButtonClasses("action", "md")}
              href="/stage-1/asset-coach"
            >
              Start Engineering
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800/80 bg-slate-900 px-8 py-8 text-slate-100 shadow-[0_20px_50px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
          <span>Progress Overview</span>
          <span>Stage 1</span>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm text-slate-200">
            <span className="font-medium text-emerald-400">
              0% Completed
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              0 / 3 Tasks
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all"
              style={{ width: "0%" }}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800/70 bg-slate-950 px-8 py-8 text-slate-100 shadow-[0_20px_55px_rgba(15,23,42,0.4)]">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Toolbox Quick Access
          </p>
          <h3 className="text-xl font-semibold text-slate-100">
            Yuh Connector
          </h3>
          <p className="text-sm text-slate-400">
            Launch Yuh directly from the dashboard to sync portfolios on demand.
          </p>
        </div>
        <div className="mt-6">
          <YuhConnector action="connect" label="Open Yuh" />
        </div>
      </section>
    </div>
  );
}
