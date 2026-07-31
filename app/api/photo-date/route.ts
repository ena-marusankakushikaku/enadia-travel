import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';

/**
 * 写真の撮影日時を設定・修正する。
 *
 * EXIFが残っていない写真はアップロード日時で代用されるため、
 * 並び順・地図の経路・おもいでの判定がすべてずれてしまう。
 * ここで実際の日付に直せるようにしている。
 *
 * 「何日目か」は別に保存せず、日付ひとつから計算する方針。
 * 権限チェックはphotosのRLS（投稿者本人 or owner/editor）に任せる。
 */
export async function POST(request: Request) {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const body = (await request.json()) as { photoId?: string; capturedAt?: string };

  if (!body.photoId) {
    return NextResponse.json({ error: 'photoId is required' }, { status: 400 });
  }

  if (!body.capturedAt) {
    return NextResponse.json({ error: '日付を指定してください。' }, { status: 400 });
  }

  const parsed = new Date(body.capturedAt);
  if (Number.isNaN(parsed.getTime())) {
    return NextResponse.json({ error: '日付の形式が正しくありません。' }, { status: 400 });
  }

  const { data: photo, error } = await supabase
    .from('photos')
    .update({ captured_at: parsed.toISOString() })
    .eq('id', body.photoId)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!photo) {
    return NextResponse.json({ error: 'この写真を編集する権限がありません。' }, { status: 403 });
  }

  return NextResponse.json({ photo });
}
