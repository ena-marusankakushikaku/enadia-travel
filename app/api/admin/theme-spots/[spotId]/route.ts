import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin';
import { findNearestPrefectureId } from '@/lib/geo/prefectureCoordinates';
import type { Database } from '@/types/db';

type SpotUpdate = Database['public']['Tables']['theme_spots']['Update'];

export async function PATCH(request: Request, { params }: { params: { spotId: string } }) {
  const { response, supabase } = await requireAdmin();
  if (response || !supabase) return response;

  const body = (await request.json()) as {
    name?: string;
    description?: string | null;
    address?: string | null;
    lat?: number;
    lng?: number;
    radiusM?: number;
    orderNo?: number;
    externalUrl?: string | null;
  };

  const update: SpotUpdate = {};

  if (body.name !== undefined) update.name = body.name.trim();
  if (body.description !== undefined) update.description = body.description || null;
  if (body.address !== undefined) update.address = body.address || null;
  if (body.radiusM !== undefined) update.radius_m = body.radiusM;
  if (body.orderNo !== undefined) update.order_no = body.orderNo;
  if (body.externalUrl !== undefined) update.external_url = body.externalUrl || null;

  if (typeof body.lat === 'number' && typeof body.lng === 'number') {
    update.lat = body.lat;
    update.lng = body.lng;
    update.prefecture_id = findNearestPrefectureId(body.lat, body.lng);
  }

  const { data, error } = await supabase
    .from('theme_spots')
    .update(update)
    .eq('id', params.spotId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ spot: data });
}

export async function DELETE(_request: Request, { params }: { params: { spotId: string } }) {
  const { response, supabase } = await requireAdmin();
  if (response || !supabase) return response;

  // すでに到達記録があるスポットは消さない。
  // 消すと、その人の記録がどこの記録だったのか分からなくなる。
  const { count } = await supabase
    .from('conquest_entries')
    .select('id', { count: 'exact', head: true })
    .eq('spot_id', params.spotId);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `すでに${count}件の到達記録があるため削除できません` },
      { status: 400 }
    );
  }

  const { error } = await supabase.from('theme_spots').delete().eq('id', params.spotId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
