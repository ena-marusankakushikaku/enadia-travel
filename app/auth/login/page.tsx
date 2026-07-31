'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getSafeRedirectPath } from '@/lib/safe-redirect';
import { useCurrentUser } from '@/hooks/useCurrentUser';

function LoginLoading() {
  return (
    <AppShell subtitle="アカウント" title="ログイン">
      <div className="py-10 text-center text-sm text-enadia-muted">読み込み中...</div>
    </AppShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const { user, loading: userLoading, logout } = useCurrentUser();
  const searchParams = useSearchParams();
  const next = getSafeRedirectPath(searchParams.get('next'));

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleEmailLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('メールアドレスを入力してください');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
        }
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        setMagicLinkSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // flow=oauth を付けるのは、コールバック画面で自動ログインしてよいか判断するため。
        // Googleからの戻りはメールを経由しないので、リンクを先読みするスキャナーに
        // 使い捨てのコードを消費される心配がない（詳細は auth/callback のコメント）。
        redirectTo: `${window.location.origin}/auth/callback?flow=oauth&next=${encodeURIComponent(next)}`
      }
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
    // On success the browser navigates to Google, so no further local state change is needed.
  };

  if (userLoading) {
    return <LoginLoading />;
  }

  return (
    <AppShell subtitle="アカウント" title={user ? 'ログイン済み' : 'ログイン'}>
      <section className="mx-auto max-w-xs space-y-4 py-8">
        {user ? (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">ログイン中</p>
              <p className="mt-1 break-all text-xs text-slate-500">{user.email}</p>
            </div>

            <Button variant="secondary" onClick={logout} className="w-full">
              ログアウト
            </Button>

            <Link href={next} className="block rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white">
              マイトリップへ戻る
            </Link>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">ENADIA Travelにログイン</p>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                旅の写真、テーマログ、全国制覇の記録を保存するにはログインが必要です。
              </p>
            </div>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            ) : null}

            <Button variant="primary" onClick={handleGoogleLogin} loading={loading} className="w-full">
              Googleで続行
            </Button>

            {magicLinkSent ? (
              <div className="flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs text-enadia-primary">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{email} 宛にログイン用リンクを送信しました。メール内のリンクを開いてログインを完了してください。</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  or
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                <label className="block text-left">
                  <span className="text-xs font-semibold text-slate-600">メールアドレス</span>
                  <input
                    className="mt-1 h-11 w-full rounded-lg border border-enadia-line bg-white px-3 text-sm outline-none focus:border-enadia-primary focus:ring-2 focus:ring-teal-100"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                  />
                </label>

                <Button variant="secondary" onClick={handleEmailLogin} loading={loading} className="w-full">
                  メールで続行
                </Button>
              </>
            )}
          </>
        )}
      </section>
    </AppShell>
  );
}
