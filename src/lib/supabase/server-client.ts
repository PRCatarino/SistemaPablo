import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function supabaseAnonKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

/** Servidor (Route Handlers / Server Actions) com a mesma chave anon — respeita RLS. */
export function getSupabaseServerAnonClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseAnonKey();
  if (!url || !key) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no ambiente"
    );
  }
  return createClient(url, key);
}
