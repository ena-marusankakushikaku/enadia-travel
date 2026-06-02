import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/db';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components cannot set cookies. Route handlers can.
        }
      },
      remove(name: string, options) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // Server Components cannot set cookies. Route handlers can.
        }
      }
    }
  });
}
