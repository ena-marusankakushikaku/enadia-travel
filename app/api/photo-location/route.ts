import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';
import { insertTourismEvent } from '@/lib/tourism-events';
import { formatPlaceName, MAP_PREFECTURES } from '@/constants/japan';
import { PREFECTURE_COORDINATES } from '@/lib/geo/prefectureCoordinates';

/**
 * GPS情報を持たない写真に、手動で場所（都道府県・地点名）を設定する。
 * 権限チェックはphotosテーブルのRLS（投稿者本人 or owner/editor）に任せ、
 * 更新できる行が無かった場合を403として扱う。
 */
export async function POST(request: Request) {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const body = (await request.json()) as {
    photoId?: string;
    prefectureId?: number;
    placeName?: string | null;
  };

  if (!body.photoId) {
    return NextResponse.json({ error: 'photoId is required' }, { status: 400 });
  }

  const prefectureId = Number(body.prefectureId);
  if (!MAP_PREFECTURES.some((prefecture) => prefecture.id === prefectureId)) {
    return NextResponse.json({ error: '都道府県を選択してください。' }, { status: 400 });
  }

  const { data: current, error: currentError } = await supabase
    .from('photos')
    .select('id, trip_id, lat, lng')
    .eq('id', body.photoId)
    .maybeSingle();

  if (currentError || !current) {
    return NextResponse.json({ error: '写真が見つかりません。' }, { status: 404 });
  }

  // EXIFで実座標が入っている写真は、その座標をそのまま活かす。
  // 座標が無い写真は、地図に出せるよう県庁所在地の座標で代用する（確度は低めに記録）。
  const hasRealCoordinates = current.lat !== null && current.lng !== null;
  const fallbackCoordinate = PREFECTURE_COORDINATES.find((item) => item.id === prefectureId);
  const lat = hasRealCoordinates ? current.lat : fallbackCoordinate?.lat ?? null;
  const lng = hasRealCoordinates ? current.lng : fallbackCoordinate?.lng ?? null;

  const placeName = formatPlaceName(prefectureId, typeof body.placeName === 'string' ? body.placeName : null);

  const { data: photo, error } = await supabase
    .from('photos')
    .update({
      prefecture_id: prefectureId,
      place_name: placeName,
      lat,
      lng,
      confidence: hasRealCoordinates ? 1 : 0.5
    })
    .eq('id', body.photoId)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!photo) {
    return NextResponse.json({ error: 'この写真を編集する権限がありません。' }, { status: 403 });
  }

  await insertTourismEvent('place_visit_detected', {
    userId: user.id,
    tripId: photo.trip_id,
    photoId: photo.id,
    prefectureId,
    lat: lat ?? undefined,
    lng: lng ?? undefined,
    placeName,
    metadata: { source: 'manual' }
  });

  return NextResponse.json({ photo });
}
