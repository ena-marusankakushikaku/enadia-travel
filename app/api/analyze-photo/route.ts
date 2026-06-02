import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';
import { insertTourismEvent } from '@/lib/tourism-events';

export async function POST(request: Request) {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const body = (await request.json()) as { photoId?: string };
  if (!body.photoId) {
    return NextResponse.json({ error: 'photoId is required' }, { status: 400 });
  }

  await supabase
    .from('photos')
    .update({ ai_processing_status: 'processing' })
    .eq('id', body.photoId);

  const suggestedThemes = [
    { theme: '絶景', projectId: null, confidence: 82, label: '🗻 絶景' },
    { theme: 'カフェ', projectId: null, confidence: 53, label: '☕ カフェ' }
  ];

  const { data: photo, error } = await supabase
    .from('photos')
    .update({
      ai_processing_status: 'completed',
      suggested_themes: suggestedThemes,
      ai_tags: ['mock-analysis', 'travel', 'place']
    })
    .eq('id', body.photoId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await insertTourismEvent('ai_analysis_completed', {
    userId: user.id,
    tripId: photo.trip_id,
    photoId: photo.id,
    prefectureId: photo.prefecture_id ?? undefined,
    lat: photo.lat ?? undefined,
    lng: photo.lng ?? undefined,
    placeName: photo.place_name ?? undefined,
    metadata: { suggestedThemes }
  });

  return NextResponse.json({ photo });
}
