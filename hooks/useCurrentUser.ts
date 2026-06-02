// src/hooks/useCurrentUser.ts （プロジェクトの配置場所に合わせて調整してください）
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    // 現在のログインユーザーを取得
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // ログイン・ログアウト状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/login'); // ログアウト後にログイン画面へリダイレクト
    setLoading(false);
  };

  return { user, loading, logout };
}
