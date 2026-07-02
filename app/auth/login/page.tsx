'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function LoginPage() {
  const { user, loading: userLoading, logout } = useCurrentUser();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [next, setNext] = useState('/trips');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(params.get('next') ?? '/trips');
  }, []);

  const handleEmailLogin = async () => {
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });

    if (otpError) {
      setError(otpError.message);
    } else {
      setOtpSent(true);
    }

    setSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setError(null);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });

    if (oauthError) {
      setError(oauthError.message);
      setSubmitting(false);
    }
  };

  const loading = userLoading || submitting;

  return (
    <AppShell subtitle="アカウント" title={user ? 'ログイン済み' : 'ログイン'}>
      <section className="mx-auto max-w-xs space-y-4 py-8">
        {user ? (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                ログイン中
              </p>
              <p className="mt-1 break-all text-xs text-slate-500">
                {user.email}
              </p>
            </div>

            <Button variant="secondary" onClick={logout} loading={userLoading} className="w-full">
              ログアウト
            </Button>

            <Link
              href="/trips"
              className="block rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              マイトリップへ戻る
            </Link>
          </>
        ) : otpSent ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">確認メールを送信しました</p>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              {email} 宛にログイン用のリンクを送信しました。メール内のリンクからログインしてください。
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                ENADIA Travelにログイン
              </p>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                旅の写真、テーマログ、全国制覇の記録を保存するにはログインが必要です。
              </p>
            </div>

            <Button
              variant="primary"
              onClick={handleGoogleLogin}
              loading={loading}
              className="w-full"
            >
              Googleで続行
            </Button>

            <div className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="メールアドレス"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <Button
                variant="secondary"
                onClick={handleEmailLogin}
                loading={loading}
                className="w-full"
              >
                メールで続行
              </Button>
            </div>

            {error ? <p className="text-xs text-enadia-danger">{error}</p> : null}

            <Link
              href="/trips"
              className="block text-center text-xs font-medium text-slate-500 underline"
            >
              いまはログインせずに見る
            </Link>
          </>
        )}
      </section>
    </AppShell>
  );
}
