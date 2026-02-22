'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'

/**
 * Verifies the current user is a super admin.
 * 1. Gets user session via the cookie-based Supabase client
 * 2. Checks the super_admins table using service role client
 * 3. Returns the service role client if authorized
 * 4. Throws an error if not authorized
 */
export async function requireSuperAdmin() {
  // Get the authenticated user from the session
  const userClient = await createClient()
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized: No authenticated user')
  }

  // Use service role client to check super_admins table (bypasses RLS)
  const serviceClient = createServiceRoleClient()
  const { data: admin, error: adminError } = await serviceClient
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (adminError || !admin) {
    throw new Error('Forbidden: User is not a super admin')
  }

  return serviceClient
}
