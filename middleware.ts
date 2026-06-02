import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/db';

const protectedPrefixes = ['/trips', '/profile', '/conquest', '/travel-log'];

export async function middleware(request: NextRequest) {
  const shouldProtect = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!shouldProtect || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value: '', ...options });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/trips/:path*', '/profile/:path*', '/conquest/:path*', '/travel-log/:path*']
};
