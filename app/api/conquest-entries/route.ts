import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';
import { insertTourismEvent } from '@/lib/tourism-events';
import type { ConquestEntrySource } from '@/types/app';
import type { Json } from '@/types/json';

export async function POST(request: Request) {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const body = (await request.json()) as {
    projectId?: string;
    tripId?: string | null;
    photoId?: string | null;
    /** 日本国内のときだけ入る。海外の記録は座標だけで登録する */
    prefectureId?: number | null;
    title?: string;
    memo?: string | null;
    rating?: number | null;
    visitedAt?: string;
    placeName?: string | null;
    lat?: number | null;
    lng?: number | null;
    source?: ConquestEntrySource;
    metadata?: Record<string, unknown>;
  };

  if (!body.projectId || !body.title?.trim()) {
    return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 });
  }

  // 海外の写真には都道府県が無いので、代わりに座標があれば登録できる。
  // どちらも無いと地図にも制覇の集計にも載らないため、そこだけは弾く。
  const prefectureId = typeof body.prefectureId === 'number' && body.prefectureId > 0 ? body.prefectureId : null;
  const hasCoordinates = typeof body.lat === 'number' && typeof body.lng === 'number';

  if (prefectureId === null && !hasCoordinates) {
    return NextResponse.json(
      { error: 'この写真には場所が設定されていません。先に「場所を修正」から場所を設定してください。' },
      { status: 400 }
    );
  }

  const { data: project, error: projectError } = await supabase
    .from('conquest_projects')
    .select('id,user_id')
    .eq('id', body.projectId)
    .eq('user_id', user.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: 'project not found' }, { status: 404 });
  }

  const { data: existingPrefectureEntry } = prefectureId
    ? await supabase
        .from('conquest_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('prefecture_id', prefectureId)
        .limit(1)
        .maybeSingle()
    : { data: null };

  const { data: entry, error } = await supabase
    .from('conquest_entries')
    .insert({
      project_id: body.projectId,
      user_id: user.id,
      trip_id: body.tripId ?? null,
      photo_id: body.photoId ?? null,
      prefecture_id: prefectureId,
      title: body.title.trim(),
      memo: body.memo ?? null,
      rating: body.rating ?? null,
      visited_at: body.visitedAt ?? new Date().toISOString(),
      place_name: body.placeName ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      source: body.source ?? 'manual',
      metadata: (body.metadata ?? {}) as Json
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.source === 'photo_suggestion' && body.photoId) {
    await supabase
      .from('photos')
      .update({ theme_entry_created: true })
      .eq('id', body.photoId);
  }

  await insertTourismEvent('theme_entry_created', {
    userId: user.id,
    tripId: body.tripId ?? undefined,
    photoId: body.photoId ?? undefined,
    conquestProjectId: body.projectId,
    conquestEntryId: entry.id,
    prefectureId: prefectureId ?? undefined,
    lat: body.lat ?? undefined,
    lng: body.lng ?? undefined,
    placeName: body.placeName ?? undefined,
    metadata: { source: body.source ?? 'manual' }
  });

  // 都道府県が無い（海外の）記録では、この都道府県の初制覇イベントは発生しない
  if (prefectureId !== null && !existingPrefectureEntry) {
    await insertTourismEvent('prefecture_conquered', {
      userId: user.id,
      conquestProjectId: body.projectId,
      conquestEntryId: entry.id,
      prefectureId
    });
  }

  return NextResponse.json({ entry }, { status: 201 });
}
