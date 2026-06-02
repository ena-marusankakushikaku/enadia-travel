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
    prefectureId?: number;
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

  if (!body.projectId || !body.prefectureId || !body.title?.trim()) {
    return NextResponse.json({ error: 'projectId, prefectureId and title are required' }, { status: 400 });
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

  const { data: existingPrefectureEntry } = await supabase
    .from('conquest_entries')
    .select('id')
    .eq('user_id', user.id)
    .eq('prefecture_id', body.prefectureId)
    .limit(1)
    .maybeSingle();

  const { data: entry, error } = await supabase
    .from('conquest_entries')
    .insert({
      project_id: body.projectId,
      user_id: user.id,
      trip_id: body.tripId ?? null,
      photo_id: body.photoId ?? null,
      prefecture_id: body.prefectureId,
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
    prefectureId: body.prefectureId,
    lat: body.lat ?? undefined,
    lng: body.lng ?? undefined,
    placeName: body.placeName ?? undefined,
    metadata: { source: body.source ?? 'manual' }
  });

  if (!existingPrefectureEntry) {
    await insertTourismEvent('prefecture_conquered', {
      userId: user.id,
      conquestProjectId: body.projectId,
      conquestEntryId: entry.id,
      prefectureId: body.prefectureId
    });
  }

  return NextResponse.json({ entry }, { status: 201 });
}
