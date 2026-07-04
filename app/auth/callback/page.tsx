'use client';

import { Suspense, useState } from 'react';
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
        <Button className="w-full" loading={loading} onClick={completeSignIn} variant="primary">
          ログインを完了する
        </Button>
      </section>
    </AppShell>
  );
}
