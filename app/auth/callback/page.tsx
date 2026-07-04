'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getSafeRedirectPath } from '@/lib/safe-redirect';

function CallbackLoading() {
  return (
    <AppShell subtitle="アカウント" title="ログイン">
      <div className="py-10 text-center text-sm text-enadia-muted">読み込み中...</div>
    </AppShell>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const next = getSafeRedirectPath(searchParams.get('next'));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // TEMPORARY: remove once the PKCE code-verifier cookie issue is diagnosed.
  const [cookieDebug, setCookieDebug] = useState<string | null>(null);

  useEffect(() => {
    const verifierCookies = document.cookie
      .split('; ')
      .filter((entry) => entry.includes('code-verifier'))
      .map((entry) => entry.split('=')[0]);
    setCookieDebug(
      verifierCookies.length > 0
        ? `code-verifier cookie present on load: ${verifierCookies.join(', ')}`
        : 'code-verifier cookie NOT found on load (all cookies: ' +
            (document.cookie
              .split('; ')
              .map((entry) => entry.split('=')[0])
              .join(', ') || 'none') +
            ')'
    );
  }, []);

  // The exchange only runs on this explicit click, never on page load, so that
  // automated link scanners (e.g. corporate email safe-link prefetchers) that
  // GET this URL can't burn the single-use code before the real user does.
  async function completeSignIn() {
    if (!code) {
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('auth callback exchangeCodeForSession failed:', exchangeError);
      setLoading(false);
      setError(exchangeError.message);
      return;
    }

    router.replace(next);
  }

  if (!code) {
    return (
      <AppShell subtitle="アカウント" title="ログイン">
        <section className="mx-auto max-w-xs space-y-4 py-8 text-center text-sm text-enadia-danger">
          ログインリンクが無効です。もう一度ログインをお試しください。
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell subtitle="アカウント" title="ログイン">
      <section className="mx-auto max-w-xs space-y-4 py-8 text-center">
        <p className="text-sm text-enadia-muted">下のボタンを押してログインを完了してください。</p>
        {error ? <p className="text-xs text-enadia-danger">{error}</p> : null}
        {/* TEMPORARY debug output, remove once the PKCE cookie issue is diagnosed */}
        {cookieDebug ? <p className="break-all text-left text-[11px] text-amber-700">{cookieDebug}</p> : null}
        <Button className="w-full" loading={loading} onClick={completeSignIn} variant="primary">
          ログインを完了する
        </Button>
      </section>
    </AppShell>
  );
}
