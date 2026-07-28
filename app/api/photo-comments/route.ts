import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';
import { insertTourismEvent } from '@/lib/tourism-events';

const MAX_LENGTH = 500;

export async function POST(request: Request) {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const body = (await request.json()) as { photoId?: string; text?: string };
  const text = typeof body.text === 'string' ? body.text.trim() : '';

  if (!body.photoId) {
    return NextResponse.json({ error: 'photoId is required' }, { status: 400 });
  }

  if (text.length === 0) {
    return NextResponse.json({ error: 'コメントを入力してください。' }, { status: 400 });
  }

  if (text.length > MAX_LENGTH) {
    return NextResponse.json({ error: `コメントは${MAX_LENGTH}文字以内で入力してください。` }, { status: 400 });
  }

  const { data: comment, error } = await supabase
    .from('photo_comments')
    .insert({ photo_id: body.photoId, user_id: user.id, text })
    .select()
    .single();

  if (error) {
    // 旅のメンバーでない場合はRLSに弾かれる
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  const { data: photo } = await supabase.from('photos').select('trip_id').eq('id', body.photoId).maybeSingle();

  await insertTourismEvent('photo_commented', {
    userId: user.id,
    tripId: photo?.trip_id ?? undefined,
    photoId: body.photoId
  });

  return NextResponse.json({ comment }, { status: 201 });
}
