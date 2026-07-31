import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';
import { mapTripRow } from '@/lib/api/trips';
import type { Database } from '@/types/db';

type TripUpdate = Database['public']['Tables']['trips']['Update'];

/**
 * 旅の基本情報を更新する。
 *
 * 旅程が延びる・縮むことは普通にあるので、作成後も開始日と終了日を直せるようにしている。
 * 開始日は「何日目」の計算の基準になっているため、ここを直すと写真の見出しも自動でついてくる。
 *
 * 編集できるのはオーナーと参加者。実際の可否はDBのRLSが判定する
 * （supabase/migrations/202607300001_trip_update_policy.sql）。
 */
type RouteContext = { params: { tripId: string } };

function normalizeDate(value: unknown): string | null | undefined {
  if (value === undefined) {
    // 送られてこなかった項目は変更しない
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return value;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const body = (await request.json()) as {
    title?: string;
    area?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
    description?: string | null;
  };

  const update: TripUpdate = {};

  if (body.title !== undefined) {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ error: '旅名を入力してください。' }, { status: 400 });
    }
    update.title = title;
  }

  if (body.area !== undefined) {
    update.area = body.area?.trim() ? body.area.trim() : null;
  }

  if (body.description !== undefined) {
    update.description = body.description?.trim() ? body.description.trim() : null;
  }

  const startsAt = normalizeDate(body.startsAt);
  const endsAt = normalizeDate(body.endsAt);

  if (body.startsAt !== undefined && startsAt === undefined) {
    return NextResponse.json({ error: '開始日の形式が正しくありません。' }, { status: 400 });
  }

  if (body.endsAt !== undefined && endsAt === undefined) {
    return NextResponse.json({ error: '終了日の形式が正しくありません。' }, { status: 400 });
  }

  if (startsAt !== undefined) {
    update.starts_at = startsAt;
  }

  if (endsAt !== undefined) {
    update.ends_at = endsAt;
  }

  if (startsAt && endsAt && new Date(startsAt).getTime() > new Date(endsAt).getTime()) {
    return NextResponse.json({ error: '終了日は開始日より後にしてください。' }, { status: 400 });
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: '更新する項目がありません。' }, { status: 400 });
  }

  const { data: tripRow, error } = await supabase
    .from('trips')
    .update(update)
    .eq('id', params.tripId)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!tripRow) {
    // RLSに弾かれると、エラーではなく「0件更新」で返ってくる
    return NextResponse.json(
      {
        error:
          'この旅を編集する権限がありません。オーナーか参加者であるか、SQL（202607300001_trip_update_policy.sql）を実行済みか確認してください。'
      },
      { status: 403 }
    );
  }

  return NextResponse.json({ trip: mapTripRow(tripRow) });
}
