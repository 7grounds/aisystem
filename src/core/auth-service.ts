/**
 * @MODULE_ID core.auth-service
 * @STAGE global
 * @DATA_INPUTS ["profiles", "organizations", "auth.user"]
 * @REQUIRED_TOOLS ["supabase"]
 */
import type { Database } from "@/core/types/database.types";
import { supabase, isSupabaseConfigured } from "@/core/supabase";

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type EnsureTenantResult = {
  organization: OrganizationRow | null;
  created: boolean;
  userName: string | null;
  error?: string;
};

const slugify = (value: string) => {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return slug.length ? slug : "lab";
};

const resolveUserName = (profile: ProfileRow | null, fallback?: string | null) =>
  profile?.full_name?.trim() ||
  fallback?.trim() ||
  "User";

type EnsureUserOrganizationOptions = {
  organizationName?: string;
};

export const ensureUserOrganization = async (
  options?: EnsureUserOrganizationOptions,
): Promise<EnsureTenantResult> => {
  if (!isSupabaseConfigured) {
    return {
      organization: null,
      created: false,
      userName: null,
      error: "Supabase not configured.",
    };
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return {
      organization: null,
      created: false,
      userName: null,
      error: authError?.message,
    };
  }

  const user = authData.user;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      organization: null,
      created: false,
      userName: user.user_metadata?.full_name ?? null,
      error: profileError.message,
    };
  }

  const userName = resolveUserName(
    profile as ProfileRow | null,
    user.user_metadata?.full_name ?? user.email ?? null,
  );

  if (profile?.organization_id) {
    const { data: organization } = await supabase
      .from("organizations")
      .select("id, name, slug, created_at")
      .eq("id", profile.organization_id)
      .maybeSingle();

    return {
      organization: organization ?? null,
      created: false,
      userName,
    };
  }

  const orgName = options?.organizationName ?? `${userName}'s Lab`;
  const orgSlug = `${slugify(orgName)}-${user.id.slice(0, 6)}`;

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: orgName, slug: orgSlug })
    .select("id, name, slug, created_at")
    .single();

  if (orgError || !organization) {
    return {
      organization: null,
      created: false,
      userName,
      error: orgError?.message,
    };
  }

  await supabase.from("profiles").upsert({
    id: user.id,
    full_name: profile?.full_name ?? userName,
    organization_id: organization.id,
    updated_at: new Date().toISOString(),
  });

  return {
    organization,
    created: true,
    userName,
  };
};
