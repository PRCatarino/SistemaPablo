import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Servidor (Route Handlers / Server Actions) com a mesma chave anon — respeita RLS. */
export function getSupabaseServerAnonClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente"
    );
  }
  return createClient(url, key);
}
