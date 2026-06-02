'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';

type DemoUser = {
  email: string;
};

export default function LoginPage() {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async () => {
    setLoading(true);

    try {
      // Supabase Auth 接続前の一時モック。
      // 第4弾で signInWithOtp / OAuth に差し替える。
      await new Promise((resolve) => setTimeout(resolve, 600));
      setUser({ email: 'demo@enadia.travel' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      // Supabase OAuth 接続前の一時モック。
      await new Promise((resolve) => setTimeout(resolve, 600));
      setUser({ email: 'google-user@enadia.travel' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setUser(null);
  };

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

            <Button variant="secondary" onClick={handleLogout} className="w-full">
              ログアウト
            </Button>

            <Link
              href="/trips"
              className="block rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              マイトリップへ戻る
            </Link>
          </>
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

            <Button
              variant="secondary"
              onClick={handleEmailLogin}
              loading={loading}
              className="w-full"
            >
              メールで続行
            </Button>

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
