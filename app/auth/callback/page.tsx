'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getSafeRedirectPath } from '@/lib/safe-redirect';
import type { EmailOtpType } from '@supabase/supabase-js';

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
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const otpType = (searchParams.get('type') as EmailOtpType | null) ?? 'email';
  const next = getSafeRedirectPath(searchParams.get('next'));

  // Googleログインからの戻りかどうか。ログイン開始時に自分で付けている目印。
  const isOAuth = searchParams.get('flow') === 'oauth';
  const hasCredential = Boolean(code || tokenHash);

  const [loading, setLoading] = useState(isOAuth);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  // ログインの引き換え方法は2種類ある。
  //
  // 1. token_hash（メールのリンク）
  //    メールを読む端末と、ログインを始めた端末が違ってもよい。
  //    PCでログインを開始してスマホでメールを開く、という使い方は普通に起きるので、
  //    メール経由はこちらを使う。
  //
  // 2. code（Googleログイン）
  //    PKCE方式。ログインを開始したブラウザに残った符号（code verifier）と
  //    組で使うため、同じブラウザで完結する必要がある。
  //    Googleログインは同じブラウザ内で戻ってくるので問題ない。
  //
  // かつてメールのリンクにも 1 ではなく 2 を使っていたため、
  // 別端末でメールを開くと「PKCE code verifier not found in storage」で失敗していた。
  //
  // どちらの方式でも、引き換えは1回しかできない。
  // メールのリンクは、会社のメールシステム（Microsoft Defenderの「安全なリンク」など）が
  // 本人より先にURLを開いて中身を調べることがある。ページを開いただけでは消費されないよう、
  // メール経由のときはボタンを押してもらう。
  //
  // detectSessionInUrl と isSingleton を上書きしているのは、既定のクライアントが
  // 生成された瞬間にURLの認証情報を自動で消費してしまい、この処理と競合して
  // 無駄にしていたため（2026/7/5に長時間ハマった箇所）。
  const completeSignIn = useCallback(async () => {
    if (!hasCredential || startedRef.current) {
      return;
    }

    startedRef.current = true;
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient({
      isSingleton: false,
      auth: { detectSessionInUrl: false }
    });

    const { error: verifyError } = tokenHash
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType })
      : await supabase.auth.exchangeCodeForSession(code as string);

    if (verifyError) {
      console.error('auth callback failed:', verifyError);
      // 失敗したときは、もう一度押せるように戻す
      startedRef.current = false;
      setLoading(false);
      setError(verifyError.message);
      return;
    }

    // router.replace ではなく画面全体を読み込み直す。
    // ログイン直後はブラウザに書かれたばかりのセッションが
    // サーバー側（middleware）にまだ渡らず、ログイン画面へ引き戻されることがあるため。
    window.location.replace(next);
  }, [code, hasCredential, next, otpType, tokenHash]);

  // Googleログインのときは、ボタンを出さずにそのまま旅一覧まで進む
  useEffect(() => {
    if (isOAuth && code) {
      void completeSignIn();
    }
  }, [code, completeSignIn, isOAuth]);

  if (!hasCredential) {
    return (
      <AppShell subtitle="アカウント" title="ログイン">
        <section className="mx-auto max-w-xs space-y-4 py-8 text-center text-sm text-enadia-danger">
          ログインリンクが無効です。もう一度ログインをお試しください。
        </section>
      </AppShell>
    );
  }

  // Googleログインが順調に進んでいる間は、待機中の表示だけ出す
  if (isOAuth && error === null) {
    return (
      <AppShell subtitle="アカウント" title="ログイン">
        <section className="mx-auto max-w-xs space-y-3 py-12 text-center">
          <span
            aria-hidden="true"
            className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-enadia-line border-t-enadia-primary"
          />
          <p className="text-sm text-enadia-muted">ログインしています…</p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell subtitle="アカウント" title="ログイン">
      <section className="mx-auto max-w-xs space-y-4 py-8 text-center">
        <p className="text-sm text-enadia-muted">
          {error
            ? 'ログインを完了できませんでした。時間をおいて、もう一度ログインをやり直してください。'
            : '下のボタンを押すとログインが完了します。'}
        </p>
        {error ? <p className="text-xs text-enadia-danger">{error}</p> : null}
        <Button className="w-full" loading={loading} onClick={completeSignIn} variant="primary">
          {error ? 'もう一度試す' : '続ける'}
        </Button>
      </section>
    </AppShell>
  );
}
