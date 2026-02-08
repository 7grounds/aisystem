/**
 * @MODULE_ID app.home.login
 * @STAGE global
 * @DATA_INPUTS ["supabase", "ensureUserOrganization"]
 * @REQUIRED_TOOLS ["supabase", "ensureUserOrganization"]
 */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/core/supabase";
import { ensureUserOrganization } from "@/core/auth-service";

export default function Home() {
  const TEST_EMAIL = "test@zasterix.ch";
  const TEST_PASSWORD = "Zasterix2026!";

  const [dbStatus, setDbStatus] = useState<
    "idle" | "checking" | "connected" | "error"
  >("idle");
  const [email, setEmail] = useState(TEST_EMAIL);
  const [password, setPassword] = useState(TEST_PASSWORD);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkDatabase = async () => {
      setDbStatus("checking");
      const { error } = await supabase
        .from("organizations")
        .select("id", { count: "exact", head: true });
      if (!isMounted) return;
      if (!error) {
        setDbStatus("connected");
        return;
      }

      const fallback = await supabase
        .from("organizations")
        .select("id", { count: "exact", head: true });
      if (!isMounted) return;
      setDbStatus(fallback.error ? "error" : "connected");
    };

    checkDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  const resolveOrganizationId = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data?.organization_id) {
      const result = await ensureUserOrganization({
        organizationName: "Zasterix Labor",
      });
      return result.organization?.id ?? null;
    }

    return data.organization_id;
  };

  const loginWithCredentials = async (
    loginEmail: string,
    loginPassword: string,
  ) => {
    setIsSubmitting(true);
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error || !data.user) {
      setAuthError(error?.message ?? "Login failed.");
      setIsSubmitting(false);
      return;
    }

    await resolveOrganizationId(data.user.id);
    window.location.href = "/dashboard";
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loginWithCredentials(email, password);
  };

  const handleTestLogin = async () => {
    setEmail(TEST_EMAIL);
    setPassword(TEST_PASSWORD);
    await loginWithCredentials(TEST_EMAIL, TEST_PASSWORD);
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 rounded-3xl border border-slate-800/70 bg-slate-950 px-8 py-10 text-slate-100 shadow-[0_25px_60px_rgba(15,23,42,0.4)]">
      <div className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
          Zasterix
        </p>
        <h1 className="text-3xl font-semibold">Launch Console</h1>
        <p className="text-sm text-slate-400">
          Authenticate to access the wealth engineering dashboard.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-3 text-center text-sm text-slate-300">
        {dbStatus === "connected" ? "✅ Datenbank verbunden" : null}
        {dbStatus === "error" ? "❌ Verbindung prüfen" : null}
        {dbStatus === "checking" ? "Verbindung wird geprüft..." : null}
      </div>

      <form className="space-y-4" onSubmit={handleLogin}>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.22em] text-slate-400">
            Email
          </label>
          <input
            className="w-full rounded-2xl border border-slate-800/70 bg-slate-900 px-4 py-3 text-sm text-slate-100 shadow-sm focus:border-emerald-400 focus:outline-none"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.22em] text-slate-400">
            Passwort
          </label>
          <input
            className="w-full rounded-2xl border border-slate-800/70 bg-slate-900 px-4 py-3 text-sm text-slate-100 shadow-sm focus:border-emerald-400 focus:outline-none"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </div>
        {authError ? (
          <p className="text-xs uppercase tracking-[0.24em] text-rose-400">
            {authError}
          </p>
        ) : null}
        <div className="space-y-3">
          <button
            className="w-full rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
          <button
            className="w-full rounded-full border border-slate-700 px-5 py-3 text-xs uppercase tracking-[0.24em] text-slate-300 transition hover:border-emerald-400/60 hover:text-emerald-200"
            disabled={isSubmitting}
            type="button"
            onClick={handleTestLogin}
          >
            Login mit Test-User
          </button>
        </div>
      </form>
    </div>
  );
}
