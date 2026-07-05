import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';
import { TripDetailClient } from '@/components/trips/TripDetailClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { mapTripRow } from '@/lib/api/trips';
import { mapTripMemberRow } from '@/lib/api/tripMembers';
import { attachPhotoImageUrls, mapPhotoRow } from '@/lib/api/photos';
import { mapProfileRow, mapPublicProfileRow } from '@/lib/api/profiles';
import { mapConquestProjectRow } from '@/lib/api/conquestProjects';
import { mapConquestEntryRow } from '@/lib/api/conquestEntries';
import { getTripRole } from '@/lib/permissions';
import type { UserProfile } from '@/types/app';

type TripDetailPageProps = {
  params: { tripId: string };
};

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: tripRow } = await supabase.from('trips').select('*').eq('id', params.tripId).maybeSingle();

  if (!tripRow) {
    return (
      <AppShell title="旅が見つかりません">
        <Link href="/trips">
          <Button variant="secondary">旅一覧へ戻る</Button>
        </Link>
      </AppShell>
    );
  }

  const [{ data: memberRows }, { data: photoRows }, { data: entryRows }, { data: ownProfileRow }] = await Promise.all([
    supabase.from('trip_members').select('*').eq('trip_id', params.tripId),
    supabase.from('photos').select('*').eq('trip_id', params.tripId).order('captured_at', { ascending: false }),
    supabase.from('conquest_entries').select('*').eq('trip_id', params.tripId).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  ]);

  const members = (memberRows ?? []).map(mapTripMemberRow);
  const photos = await attachPhotoImageUrls(supabase, (photoRows ?? []).map(mapPhotoRow));
  const themeEntries = (entryRows ?? []).map(mapConquestEntryRow);
  const currentRole = getTripRole(params.tripId, user.id, members);
  const trip = mapTripRow(tripRow, members.map((member) => member.userId));

  const { data: projectRows } = await supabase.from('conquest_projects').select('*').eq('user_id', user.id);
  const themeProjects = (projectRows ?? []).map(mapConquestProjectRow);

  const memberUserIds = Array.from(new Set(members.map((member) => member.userId)));
  const { data: publicProfileRows } = memberUserIds.length
    ? await supabase.from('public_profiles').select('*').in('id', memberUserIds)
    : { data: [] };

  const usersById = new Map<string, UserProfile>(
    (publicProfileRows ?? [])
      .filter((row): row is typeof row & { id: string } => row.id !== null)
      .map((row) => [row.id, mapPublicProfileRow(row)])
  );
  const currentUser = ownProfileRow
    ? mapProfileRow(ownProfileRow)
    : { id: user.id, displayName: user.email ?? 'Traveler', avatarUrl: null, plan: 'free' as const, homePrefectureId: null };
  usersById.set(currentUser.id, currentUser);

  return (
    <AppShell subtitle={currentRole ? `${currentRole} role` : 'no member role'} title="旅詳細">
      <TripDetailClient
        currentRole={currentRole}
        currentUserId={user.id}
        members={members}
        photos={photos}
        themeEntries={themeEntries}
        themeProjects={themeProjects}
        trip={trip}
        users={Array.from(usersById.values())}
      />
    </AppShell>
  );
}
