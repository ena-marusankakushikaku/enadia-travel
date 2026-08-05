import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin';
import { getAppSettings } from '@/lib/settings';
import { findNearestPrefectureId } from '@/lib/geo/prefectureCoordinates';

export async function POST(request: Request) {
  const { response, supabase } = await requireAdmin();
  if (response || !supabase) return response;

  const body = (await request.json()) as {
    templateId?: string;
    name?: string;
    description?: string | null;
    address?: string | null;
    lat?: number;
    lng?: number;
    radiusM?: number;
    orderNo?: number;
    externalUrl?: string | null;
  };

  if (!body.templateId || !body.name?.trim()) {
    return NextResponse.json({ error: 'テーマとスポット名は必須です' }, { status: 400 });
  }

  if (typeof body.lat !== 'number' || typeof body.lng !== 'number') {
    return NextResponse.json({ error: '緯度と経度を入力してください' }, { status: 400 });
  }

  const settings = await getAppSettings(supabase);

  const { data: lastSpot } = await supabase
    .from('theme_spots')
    .select('order_no')
    .eq('template_id', body.templateId)
    .order('order_no', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from('theme_spots')
    .insert({
      template_id: body.templateId,
      name: body.name.trim(),
      description: body.description || null,
      address: body.address || null,
      // 座標から都道府県を割り出しておく。レポートで県別に出すときに使う
      prefecture_id: findNearestPrefectureId(body.lat, body.lng),
      lat: body.lat,
      lng: body.lng,
      radius_m: body.radiusM ?? settings.spot_default_radius_m,
      order_no: body.orderNo ?? (lastSpot?.order_no ?? 0) + 1,
      external_url: body.externalUrl || null
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ spot: data }, { status: 201 });
}
