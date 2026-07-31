import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';
import { insertTourismEvent } from '@/lib/tourism-events';
import { extractPhotoExif } from '@/lib/geo/photoExif';
import { resolveLocation } from '@/lib/geo/reverseGeocode';

export async function POST(request: Request) {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const formData = await request.formData();
  const tripId = String(formData.get('tripId') ?? '');
  const file = formData.get('file');
  const thumbnail = formData.get('thumbnail');
  const caption = formData.get('caption');

  if (!tripId) {
    return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  const { data: roleData, error: roleError } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (roleError || !roleData || roleData.role === 'viewer') {
    return NextResponse.json({ error: 'editor role required' }, { status: 403 });
  }

  // EXIFはブラウザ側で読み取って送ってもらう。
  // アップロード前に画像を縮小しており、その時点でEXIFが失われるため。
  // 送られてこなかった場合（古いクライアント等）は、ここで読み直す。
  const exif = await resolvePhotoExif(formData, file);
  const location =
    exif.lat !== null && exif.lng !== null ? await resolveLocation(exif.lat, exif.lng).catch(() => null) : null;

  const extension = file.name.split('.').pop() ?? 'jpg';
  const photoId = crypto.randomUUID();
  const storagePath = `${tripId}/${photoId}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from('trip-photos')
    .upload(storagePath, file, { contentType: file.type || 'image/jpeg' });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // 一覧のグリッドではサムネイルを表示する。
  // 失敗しても表示用の画像で代替できるので、アップロード自体は止めない。
  let thumbnailPath: string | null = null;
  if (thumbnail instanceof File) {
    const candidatePath = `${tripId}/${photoId}-thumb.jpg`;
    const { error: thumbnailError } = await supabase.storage
      .from('trip-photos')
      .upload(candidatePath, thumbnail, { contentType: thumbnail.type || 'image/jpeg' });

    if (!thumbnailError) {
      thumbnailPath = candidatePath;
    }
  }

  const { data: photo, error: insertError } = await supabase
    .from('photos')
    .insert({
      trip_id: tripId,
      uploaded_by: user.id,
      storage_path: storagePath,
      thumbnail_path: thumbnailPath,
      caption: typeof caption === 'string' ? caption : null,
      lat: exif.lat,
      lng: exif.lng,
      captured_at: exif.capturedAt,
      prefecture_id: location?.prefectureId ?? null,
      place_name: location?.placeName ?? null,
      confidence: location?.confidence ?? null,
      ai_processing_status: 'pending',
      suggested_themes: [],
      ai_tags: [],
      theme_entry_created: false
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await insertTourismEvent('photo_uploaded', {
    userId: user.id,
    tripId,
    photoId: photo.id,
    metadata: { storagePath }
  });

  if (location) {
    await insertTourismEvent('place_visit_detected', {
      userId: user.id,
      tripId,
      photoId: photo.id,
      prefectureId: location.prefectureId ?? undefined,
      lat: exif.lat ?? undefined,
      lng: exif.lng ?? undefined,
      placeName: location.placeName ?? undefined,
      metadata: { source: location.source }
    });
  }

  return NextResponse.json(
    {
      photo,
      // 位置情報が取れなかった場合、クライアント側で手動入力を促すために返す
      locationDetected: location !== null,
      // 撮影日が取れなかった写真はアップロード日時で表示されるため、後で直せることを伝える
      capturedAtDetected: exif.capturedAt !== null
    },
    { status: 201 }
  );
}

/**
 * EXIFの値を決める。
 * ブラウザから送られてきた値を優先し、無ければファイルから読み直す。
 */
async function resolvePhotoExif(formData: FormData, file: File) {
  const lat = Number(formData.get('lat'));
  const lng = Number(formData.get('lng'));
  const capturedAt = formData.get('capturedAt');

  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng) && formData.has('lat') && formData.has('lng');
  const hasCapturedAt = typeof capturedAt === 'string' && capturedAt.length > 0;

  if (hasCoordinates || hasCapturedAt) {
    return {
      lat: hasCoordinates ? lat : null,
      lng: hasCoordinates ? lng : null,
      capturedAt: hasCapturedAt ? capturedAt : null
    };
  }

  // 位置情報の取得はあくまで付加価値なので、ここで失敗してもアップロード自体は成功させる
  return extractPhotoExif(await file.arrayBuffer()).catch(() => ({
    lat: null,
    lng: null,
    capturedAt: null
  }));
}
