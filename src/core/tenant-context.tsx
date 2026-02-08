/**
 * @MODULE_ID core.tenant-context
 * @STAGE global
 * @DATA_INPUTS ["organization", "isReady"]
 * @REQUIRED_TOOLS ["ensureUserOrganization"]
 */
"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/core/types/database.types";
import { ensureUserOrganization } from "@/core/auth-service";

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];

type TenantContextValue = {
  organization: OrganizationRow | null;
  isReady: boolean;
};

const TenantContext = createContext<TenantContextValue>({
  organization: null,
  isReady: false,
});

export const useTenant = () => useContext(TenantContext);

type TenantProviderProps = {
  children: ReactNode;
};

export const TenantProvider = ({ children }: TenantProviderProps) => {
  const router = useRouter();
  const [organization, setOrganization] = useState<OrganizationRow | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const hydrateTenant = async () => {
      const result = await ensureUserOrganization();
      if (!isActive) return;

      setOrganization(result.organization);
      setIsReady(true);

      if (result.created && result.organization) {
        setToastMessage(`Workspace initialized for ${result.organization.name}`);
        router.replace("/");
        window.setTimeout(() => {
          if (isActive) {
            setToastMessage(null);
          }
        }, 3500);
      }
    };

    hydrateTenant();

    return () => {
      isActive = false;
    };
  }, [router]);

  const value = useMemo(
    () => ({ organization, isReady }),
    [organization, isReady],
  );

  return (
    <TenantContext.Provider value={value}>
      {isReady ? children : null}
      {toastMessage ? (
        <div className="fixed bottom-6 right-6 rounded-2xl border border-emerald-400/30 bg-slate-950 px-4 py-3 text-xs uppercase tracking-[0.2em] text-emerald-200 shadow-[0_12px_30px_rgba(15,23,42,0.4)]">
          {toastMessage}
        </div>
      ) : null}
    </TenantContext.Provider>
  );
};
