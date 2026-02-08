import { supabase } from "./supabase";

export const requestMagicLink = async (email: string) => {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: "/",
    },
  });
};

export const getSession = async () => {
  return supabase.auth.getSession();
};
