import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/db';

const protectedPrefixes = ['/trips', '/profile', '/conquest', '/travel-log'];

export async function middleware(request: NextRequest) {
  const shouldProtect = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (!shouldProtect) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase isn't configured, so we can't verify the session. Fail closed
    // rather than letting requests to protected paths through unauthenticated.
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
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

  // getUser() は画面を1つ移動するたびにSupabaseの認証サーバーへ問い合わせる。
  // 日本からの往復が毎回積み重なり、タブを押してから画面が出るまでの待ち時間になっていた。
  //
  // getClaims() は、Supabase側で「非対称鍵（asymmetric signing keys）」を有効にしていれば
  // 通信せずにこのサーバーの中だけでトークンを検証できる。
  // 有効にしていない場合は従来通り問い合わせに行くだけなので、入れて損はない。
  const { data, error: claimsError } = await supabase.auth.getClaims();
  const user = claimsError ? null : data?.claims ?? null;

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
