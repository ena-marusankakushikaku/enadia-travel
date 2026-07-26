'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/common/AppShell';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const acceptInvite = async () => {
      const supabase = createSupabaseBrowserClient();

      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        const { error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) {
          setErrorMessage('ログイン処理に失敗しました。もう一度お試しください。');
          setStatus('error');
          return;
        }
      }

      const { data: tripId, error: redeemError } = await supabase.rpc('redeem_trip_invite', {
        p_token: params.token
      });

      if (redeemError || !tripId) {
        setErrorMessage('この招待リンクは無効か、有効期限が切れています。');
        setStatus('error');
        return;
      }

      router.replace(`/trips/${tripId}`);
    };

    acceptInvite();
  }, [params.token, router]);

  if (status === 'error') {
    return (
      <AppShell subtitle="招待" title="参加できませんでした">
        <div className="mx-auto max-w-xs space-y-4 py-10 text-center">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell subtitle="招待" title="参加処理中...">
      <div className="py-10 text-center text-sm text-enadia-muted">
        旅に参加しています。少々お待ちください...
      </div>
    </AppShell>
  );
}
