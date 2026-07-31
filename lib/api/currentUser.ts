import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

export type CurrentUser = {
  id: string;
  email: string | null;
};

/**
 * ログイン中のユーザーを取得する（画面表示用）。
 *
 * getUser() は呼ぶたびにSupabaseの認証サーバーへ問い合わせるため、
 * 画面を1つ開くごとに海外との往復が1回増えていた。
 *
 * getClaims() は、Supabase側で非対称鍵を有効にしていれば
 * 通信せずにこのサーバーの中だけでトークンを検証できる。
 *
 * なお、そもそもログインしているかどうかは middleware が入口で弾いている。
 * ここでの確認は「念のため」と「ユーザーIDを取り出すため」。
 */
export async function getCurrentUser(supabase: SupabaseClient<Database>): Promise<CurrentUser | null> {
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  const email = typeof data.claims.email === 'string' ? data.claims.email : null;
  return { id: data.claims.sub, email };
}
