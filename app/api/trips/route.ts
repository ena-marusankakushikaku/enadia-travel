import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';
import { mapTripRow } from '@/lib/api/trips';
import { insertTourismEvent } from '@/lib/tourism-events';

export async function GET() {
  const { response, supabase } = await requireUser();
  if (response) return response;

  const { data: tripRows, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: members } = await supabase.from('trip_members').select('*');
  const { data: photos } = await supabase.from('photos').select('*');
  const { data: conquestEntries } = await supabase.from('conquest_entries').select('*');

  const trips = (tripRows ?? []).map((row) => {
    const memberIds = (members ?? [])
      .filter((member) => member.trip_id === row.id)
      .map((member) => member.user_id);
    return mapTripRow(row, memberIds);
  });

  return NextResponse.json({
    trips,
    photos: photos ?? [],
    members: members ?? [],
    conquestEntries: conquestEntries ?? []
  });
}

export async function POST(request: Request) {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const body = (await request.json()) as {
    title?: string;
    area?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
    description?: string | null;
  };

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const { data: tripId, error } = await supabase.rpc('create_trip_with_owner', {
    p_title: body.title.trim(),
    p_area: body.area ?? null,
    p_starts_at: body.startsAt ?? null,
    p_ends_at: body.endsAt ?? null,
    p_description: body.description ?? null
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await insertTourismEvent('trip_created', {
    userId: user.id,
    tripId,
    metadata: { title: body.title }
  });

  return NextResponse.json({ tripId }, { status: 201 });
}
