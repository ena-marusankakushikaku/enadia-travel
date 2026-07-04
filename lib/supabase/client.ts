'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

type SupabaseBrowserClientOptions = SupabaseClientOptions<'public'> & { isSingleton?: boolean };

export function createSupabaseBrowserClient(options?: SupabaseBrowserClientOptions) {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), options);
}
