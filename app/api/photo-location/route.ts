import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';
import { insertTourismEvent } from '@/lib/tourism-events';
import { formatPlaceName, MAP_PREFECTURES } from '@/constants/japan';
import { isWithinJapanBounds, PREFECTURE_COORDINATES } from '@/lib/geo/prefectureCoordinates';

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
    /** 地名検索の候補から選んだ場合の座標。県庁所在地ではなく実際の場所にピンを置ける */
    lat?: number | null;
    lng?: number | null;
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

  // どの座標を使うかは、確からしい順に決める。
  // 1. 地名検索の候補から選んだ座標（ユーザーが明示的にその場所だと言っている）
  // 2. EXIFに入っていた座標
  // 3. どちらも無ければ県庁所在地で代用（地図にピンは出るが、位置は県単位の目安）
  const pickedLat = typeof body.lat === 'number' ? body.lat : null;
  const pickedLng = typeof body.lng === 'number' ? body.lng : null;
  const hasPickedCoordinates =
    pickedLat !== null && pickedLng !== null && isWithinJapanBounds(pickedLat, pickedLng);
  const hasExifCoordinates = current.lat !== null && current.lng !== null;
  const fallbackCoordinate = PREFECTURE_COORDINATES.find((item) => item.id === prefectureId);

  let lat: number | null;
  let lng: number | null;
  let confidence: number;

  if (hasPickedCoordinates) {
    lat = pickedLat;
    lng = pickedLng;
    confidence = 0.9;
  } else if (hasExifCoordinates) {
    lat = current.lat;
    lng = current.lng;
    confidence = 1;
  } else {
    lat = fallbackCoordinate?.lat ?? null;
    lng = fallbackCoordinate?.lng ?? null;
    confidence = 0.5;
  }

  const placeName = formatPlaceName(prefectureId, typeof body.placeName === 'string' ? body.placeName : null);

  const { data: photo, error } = await supabase
    .from('photos')
    .update({
      prefecture_id: prefectureId,
      place_name: placeName,
      lat,
      lng,
      confidence
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
