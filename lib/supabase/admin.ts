import { createClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client — bypasses RLS entirely.
 * Only use in server-side agent routes authenticated by webhook secret.
 * Never expose to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
