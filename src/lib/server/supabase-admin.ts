import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseAdmin: SupabaseClient | null | undefined;

export const isSupabaseServerConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export function getSupabaseStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "media";
}

export function getSupabaseAdmin() {
  if (!isSupabaseServerConfigured) {
    return null;
  }

  if (supabaseAdmin !== undefined) {
    return supabaseAdmin;
  }

  supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return supabaseAdmin;
}

export function requireSupabaseAdmin() {
  const client = getSupabaseAdmin();

  if (!client) {
    throw new Error("Supabase n'est pas configure cote serveur.");
  }

  return client;
}

export function getSupabasePublicUrl(path: string) {
  return requireSupabaseAdmin().storage
    .from(getSupabaseStorageBucket())
    .getPublicUrl(path).data.publicUrl;
}

export function isMissingRowError(error: { code?: string } | null) {
  return error?.code === "PGRST116";
}

