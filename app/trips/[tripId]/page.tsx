import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';
import { TripDetailClient } from '@/components/trips/TripDetailClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { mapTripRow } from '@/lib/api/trips';
import { mapTripMemberRow } from '@/lib/api/tripMembers';
import { attachPhotoImageUrls, attachPhotoInteractions, mapPhotoRow } from '@/lib/api/photos';
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
  const photosWithUrls = await attachPhotoImageUrls(supabase, (photoRows ?? []).map(mapPhotoRow));
  const photos = await attachPhotoInteractions(supabase, photosWithUrls, user.id);
  const themeEntries = (entryRows ?? []).map(mapConquestEntryRow);
  const currentRole = getTripRole(params.tripId, user.id, members);
  const trip = mapTripRow(tripRow, members.map((member) => member.userId));

  // テーマ選択で「N / 47県」を出すため、この旅に限らず自分の記録をすべて取得する
  const [{ data: projectRows }, { data: allEntryRows }] = await Promise.all([
    supabase.from('conquest_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('conquest_entries').select('*').eq('user_id', user.id)
  ]);
  const allEntries = (allEntryRows ?? []).map(mapConquestEntryRow);
  const themeProjects = (projectRows ?? []).map((row) => ({
    ...mapConquestProjectRow(row),
    entries: allEntries.filter((entry) => entry.projectId === row.id)
  }));

  const memberUserIds = Array.from(new Set(members.map((member) => member.userId)));
  const { data: publicProfileRows } = memberUserIds.length
    ? await supabase.from('public_profiles').select('*').in('id', memberUserIds)
    : { data: [] };

  const usersById = new Map<string, UserProfile>((publicProfileRows ?? []).map((row) => [row.id, mapPublicProfileRow(row)]));
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
