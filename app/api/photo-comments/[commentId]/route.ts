import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';

type RouteParams = {
  params: { commentId: string };
};

/**
 * コメントを削除する。
 * 自分のコメント、または旅のオーナーであれば削除できる（RLSで制御）。
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const { data, error } = await supabase
    .from('photo_comments')
    .delete()
    .eq('id', params.commentId)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'コメントが見つからないか、削除する権限がありません。' }, { status: 404 });
  }

  return NextResponse.json({ deletedId: data.id });
}
