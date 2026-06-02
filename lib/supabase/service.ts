import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env';

export function createSupabaseServiceClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
