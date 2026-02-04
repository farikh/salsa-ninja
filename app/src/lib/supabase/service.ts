import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with the service_role key.
 * This bypasses RLS and should ONLY be used in:
 * - Server-side cron jobs
 * - Admin operations that need to bypass RLS
 *
 * NEVER expose this client to the browser.
 */
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
