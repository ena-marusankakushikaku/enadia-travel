import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';

type RouteParams = {
  params: { entryId: string };
};

/**
 * 制覇記録を更新する。
 * 場所（都道府県・地点名・座標）は写真側の情報と連動させるため、ここでは変更しない。
 * 権限チェックはconquest_entriesのRLS（本人の記録のみ）に任せる。
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const body = (await request.json()) as {
    title?: string;
    memo?: string | null;
    rating?: number | null;
    visitedAt?: string;
  };

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (title.length === 0) {
    return NextResponse.json({ error: '店名・商品名を入力してください。' }, { status: 400 });
  }

  let rating: number | null = null;
  if (body.rating !== null && body.rating !== undefined) {
    const parsed = Number(body.rating);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) {
      return NextResponse.json({ error: '評価は0.0〜5.0で指定してください。' }, { status: 400 });
    }
    // 0.1刻みに丸める
    rating = Math.round(parsed * 10) / 10;
  }

  const { data: entry, error } = await supabase
    .from('conquest_entries')
    .update({
      title,
      memo: typeof body.memo === 'string' && body.memo.trim().length > 0 ? body.memo.trim() : null,
      rating,
      ...(body.visitedAt ? { visited_at: body.visitedAt } : {})
    })
    .eq('id', params.entryId)
    .select()
    .maybeSingle();

  if (error) {
    // 評価を小数にするSQLを実行していない場合、ここで型の不一致エラーになる
    return NextResponse.json(
      {
        error: `${error.message}（評価に小数を保存できない場合は、supabase/migrations/202607280002_rating_decimal.sql をSupabaseで実行してください）`
      },
      { status: 500 }
    );
  }

  if (!entry) {
    return NextResponse.json({ error: '記録が見つからないか、編集する権限がありません。' }, { status: 404 });
  }

  return NextResponse.json({ entry });
}

/**
 * 制覇記録を削除する。
 * 権限チェックはconquest_entriesのRLS（本人の記録のみ削除可）に任せ、
 * 削除できる行が無かった場合を404として扱う。
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const { data, error } = await supabase
    .from('conquest_entries')
    .delete()
    .eq('id', params.entryId)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: '記録が見つからないか、削除する権限がありません。' }, { status: 404 });
  }

  return NextResponse.json({ deletedId: data.id });
}
