'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Chrome, LogOut, Mail } from 'lucide-react';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function LoginPage() {
  const router = useRouter();
  const { loading, logout, user } = useCurrentUser();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // すでにログインしている場合は、メインのマイページや旅一覧へ自動遷移
  useEffect(() => {
    if (!loading && user) {
      router.push('/trips'); 
    }
  }, [user, loading, router]);

  async function signInWithGoogle() {
    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/trips`
      }
    });
    if (error) {
      setMessage(error.message);
      setSubmitting(false);
    }
  }

  async function signInWithEmail() {
    if (!email) {
      setMessage('メールアドレスを入力してください。');
      return;
    }
    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/trips`
      }
    });
    setSubmitting(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('ログイン用のマジックリンクをメールで送信しました。確認してください。');
    }
  }

  if (loading) {
    return (
      <AppShell title="読み込み中...">
        <div className="text-center py-8 text-enadia-muted">アカウント状態を確認しています...</div>
      </AppShell>
    );
  }

  return (
    <AppShell subtitle="アカウント" title={user ? 'ログイン済み' : 'ログイン'}>
      <section className="mx-auto max-w-xs space-y-4 py-8">
        {user ? (
          <>
            <p className="text-sm text-center text-enadia-ink mb-4">
              {user.email} としてログインしています。
            </p>
            <Button onClick={() => router.push('/trips')} className="w-full" variant="dark">
              旅一覧へ
            </Button>
            <Button icon={<LogOut className=\"h-4 w-4\" aria-hidden=\"true\" />} onClick={logout} variant=\"secondary\" className=\"w-full\">
              ログアウト
            </Button>
          </>
        ) : (
          <>
            <Button
              className="w-full"
              disabled={submitting}
              icon={<Chrome className="h-4 w-4" aria-hidden="true" />}
              loading={submitting}
              onClick={signInWithGoogle}
              variant="dark"
            >
              Googleでログイン
            </Button>
            <div className="space-y-2">
              <label className="text-sm font-bold text-enadia-ink">Magic link</label>\n              <input
                className="h-11 w-full rounded-lg border border-enadia-line px-3"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
              />
              <Button
                className="w-full"
                icon={<Mail className="h-4 w-4" aria-hidden="true" />}
                loading={submitting}
                onClick={signInWithEmail}
                variant="secondary"
              >
                メールでログイン
              </Button>
            </div>
          </>
        )}
        {message ? <p className="rounded-lg bg-slate-50 p-3 text-sm text-enadia-muted">{message}</p> : null}
      </section>
    </AppShell>
  );
}
