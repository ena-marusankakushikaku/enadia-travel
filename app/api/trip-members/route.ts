import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import type { TripRole } from '@/types/app';

const validRoles: TripRole[] = ['owner', 'editor', 'viewer'];

export async function POST(request: Request) {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const body = (await request.json()) as {
    tripId?: string;
    email?: string;
    role?: TripRole;
  };

  const tripId = body.tripId;
  const email = body.email?.trim().toLowerCase();
  const role = body.role;

  if (!tripId || !email || !role || !validRoles.includes(role)) {
    return NextResponse.json({ error: 'tripId, email and a valid role are required' }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membership?.role !== 'owner') {
    return NextResponse.json({ error: 'owner role required' }, { status: 403 });
  }

  const { data: profile } = await createSupabaseServiceClient()
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: 'そのメールアドレスのユーザーが見つかりませんでした' }, { status: 404 });
  }

  const { data: member, error } = await supabase
    .from('trip_members')
    .insert({ trip_id: tripId, user_id: profile.id, role })
    .select()
    .single();

  if (error) {
    const message = error.code === '23505' ? 'すでにメンバーに追加されています' : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ member }, { status: 201 });
}
