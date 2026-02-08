/**
 * @MODULE_ID shared.components.boardroom-link
 * @STAGE global
 * @DATA_INPUTS ["auth.user"]
 * @REQUIRED_TOOLS ["supabase"]
 */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/core/supabase";

export const BoardroomLink = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const resolveUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      setIsAdmin(data.user?.email === "test@zasterix.ch");
    };

    resolveUser();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <Link
      className="flex items-center justify-center rounded-full bg-amber-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-900 shadow-[0_12px_30px_rgba(251,191,36,0.35)] transition hover:bg-amber-200"
      href="/admin/cockpit"
    >
      Boardroom
    </Link>
  );
};
