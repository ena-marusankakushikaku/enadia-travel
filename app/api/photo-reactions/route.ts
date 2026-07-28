import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';

const ALLOWED_TYPES = ['like', 'heart'] as const;
type ReactionType = (typeof ALLOWED_TYPES)[number];

/**
 * いいね（like）とお気に入り（heart）の付け外しをする。
 * すでに付いていれば外す、付いていなければ付ける、の切り替え動作。
 * 権限チェックはphoto_reactionsのRLSに任せる。
 */
export async function POST(request: Request) {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const body = (await request.json()) as { photoId?: string; reactionType?: string };

  if (!body.photoId) {
    return NextResponse.json({ error: 'photoId is required' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(body.reactionType as ReactionType)) {
    return NextResponse.json({ error: 'reactionType must be like or heart' }, { status: 400 });
  }

  const reactionType = body.reactionType as ReactionType;

  const { data: existing, error: selectError } = await supabase
    .from('photo_reactions')
    .select('id')
    .eq('photo_id', body.photoId)
    .eq('user_id', user.id)
    .eq('reaction_type', reactionType)
    .maybeSingle();

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  if (existing) {
    const { error } = await supabase.from('photo_reactions').delete().eq('id', existing.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ active: false });
  }

  const { error } = await supabase.from('photo_reactions').insert({
    photo_id: body.photoId,
    user_id: user.id,
    reaction_type: reactionType
  });

  if (error) {
    // 旅のメンバーでない場合はRLSに弾かれる
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ active: true }, { status: 201 });
}
