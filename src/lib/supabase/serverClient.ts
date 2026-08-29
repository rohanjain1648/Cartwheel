import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// This client uses the service-role key and must only ever be imported
// from server-side code (Route Handlers). It is the single boundary through
// which cart_items/participants get mutated, per the plan's Global Constraints.
export function getServerClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
