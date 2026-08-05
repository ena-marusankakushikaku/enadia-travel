import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { getCurrentUser } from '@/lib/api/currentUser';
import type { Database } from '@/types/db';

/**
 * ログイン中のユーザーが運営メンバーかどうか。
 *
 * profiles.is_admin を見る。plan（課金の状態）とは別の軸で持っている。
 */
export async function isCurrentUserAdmin(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', userId).maybeSingle();
  return data?.is_admin === true;
}

/**
 * 管理画面のAPI用。管理者でなければ 401/403 を返す。
 *
 * 返す supabase は **service_role** のクライアント。
 * theme_templates などは書き込みポリシーを作っていないので、
 * ここを通らないと入稿できない ＝ 権限チェックの通り道が1本になる。
 */
export async function requireAdmin() {
  const userClient = createSupabaseServerClient();
  const user = await getCurrentUser(userClient);

  if (!user) {
    return {
      admin: null,
      supabase: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    } as const;
  }

  if (!(await isCurrentUserAdmin(userClient, user.id))) {
    return {
      admin: null,
      supabase: null,
      response: NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    } as const;
  }

  return {
    admin: user,
    supabase: createSupabaseServiceClient(),
    response: null
  } as const;
}

/** 画面（Server Component）側で使う。管理者でなければ null を返す */
export async function getAdminUser() {
  const supabase = createSupabaseServerClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return null;
  }

  return (await isCurrentUserAdmin(supabase, user.id)) ? user : null;
}
