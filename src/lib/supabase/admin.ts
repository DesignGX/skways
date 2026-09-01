import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Creates a Supabase admin client using the service role key.
 *
 * SECURITY: This module is server-only. It bypasses RLS and must never be
 * imported from client components. Use it exclusively for privileged
 * operations (creating user accounts, public actions that have no session,
 * and system-level maintenance).
 *
 * Typed client: schema from @/types/database.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase service role key. Add SUPABASE_SERVICE_ROLE_KEY to your server environment."
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}