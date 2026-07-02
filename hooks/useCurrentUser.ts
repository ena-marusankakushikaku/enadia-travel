// src/hooks/useCurrentUser.ts （プロジェクトの配置場所に合わせて調整してください）
'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createSupabaseBrowserClient());

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
    // Hard navigation so no stale client state (or the user object held by
    // this hook's callers) can outlive the cleared session.
    window.location.assign('/auth/login');
  };

  return { user, loading, logout };
}
