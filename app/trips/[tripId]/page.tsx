import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';
import { TripDetailClient } from '@/components/trips/TripDetailClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { mapTripRow } from '@/lib/api/trips';
import { mapTripMemberRow } from '@/lib/api/tripMembers';
import {
  attachPhotoInteractions,
  collectPhotoPaths,
  createSignedPhotoUrls,
  mapPhotoRow,
  PHOTO_SELECT_COLUMNS,
  withPhotoUrls
} from '@/lib/api/photos';
import { getCurrentUser } from '@/lib/api/currentUser';
import { mapProfileRow, mapPublicProfileRow } from '@/lib/api/profiles';
import { mapConquestProjectRow } from '@/lib/api/conquestProjects';
import { mapConquestEntryRow } from '@/lib/api/conquestEntries';
import { getTripRole } from '@/lib/permissions';
import { getRoleLabel } from '@/constants/roles';
import type { UserProfile } from '@/types/app';

type TripDetailPageProps = {
  params: { tripId: string };
};

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const supabase = createSupabaseServerClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    redirect('/auth/login');
  }

  // 以前はここで7回ほど順番に問い合わせていた。1回ごとに往復が発生するため、
  // 写真が少なくても画面が出るまで待たされていた。
  // 依存関係のない問い合わせはまとめて同時に投げる。
  const [
    { data: tripRow },
    { data: memberRows },
    { data: photoRows },
    { data: entryRows },
    { data: ownProfileRow },
    { data: projectRows },
    { data: allEntryRows }
  ] = await Promise.all([
    supabase.from('trips').select('*').eq('id', params.tripId).maybeSingle(),
    supabase.from('trip_members').select('*').eq('trip_id', params.tripId),
    supabase.from('photos').select(PHOTO_SELECT_COLUMNS).eq('trip_id', params.tripId),
    supabase.from('conquest_entries').select('*').eq('trip_id', params.tripId).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('conquest_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    // テーマ選択で「N / 47県」を出すため、この旅に限らず自分の記録をすべて取得する
    supabase.from('conquest_entries').select('*').eq('user_id', user.id)
  ]);

  if (!tripRow) {
    return (
      <AppShell title="旅が見つかりません">
        <Link href="/trips">
          <Button variant="secondary">旅一覧へ戻る</Button>
        </Link>
      </AppShell>
    );
  }

  const members = (memberRows ?? []).map(mapTripMemberRow);
  // 旅行前・1日目から順に見られるよう、撮影日の古い順に並べる。
  // 撮影日が無い写真はアップロード日時（ts）で代用する。
  const photoRowsSorted = (photoRows ?? []).map(mapPhotoRow).sort((a, b) => {
    const left = new Date(a.ts).getTime();
    const right = new Date(b.ts).getTime();
    if (Number.isNaN(left)) return 1;
    if (Number.isNaN(right)) return -1;
    return left - right;
  });
  const memberUserIds = Array.from(new Set(members.map((member) => member.userId)));

  // 写真の一覧が決まってから必要になるものを、まとめて同時に取る
  const [urlByPath, photosWithInteractions, { data: publicProfileRows }] = await Promise.all([
    createSignedPhotoUrls(supabase, collectPhotoPaths(photoRowsSorted)),
    attachPhotoInteractions(supabase, photoRowsSorted, user.id),
    memberUserIds.length
      ? supabase.from('public_profiles').select('*').in('id', memberUserIds)
      : Promise.resolve({ data: [] })
  ]);

  const photos = photosWithInteractions.map((photo) => withPhotoUrls(photo, urlByPath));

  const themeEntries = (entryRows ?? []).map(mapConquestEntryRow);
  const currentRole = getTripRole(params.tripId, user.id, members);
  const trip = mapTripRow(tripRow, members.map((member) => member.userId));

  const allEntries = (allEntryRows ?? []).map(mapConquestEntryRow);
  const themeProjects = (projectRows ?? []).map((row) => ({
    ...mapConquestProjectRow(row),
    entries: allEntries.filter((entry) => entry.projectId === row.id)
  }));

  const usersById = new Map<string, UserProfile>((publicProfileRows ?? []).map((row) => [row.id, mapPublicProfileRow(row)]));
  const currentUser = ownProfileRow
    ? mapProfileRow(ownProfileRow)
    : { id: user.id, displayName: user.email ?? 'Traveler', avatarUrl: null, plan: 'free' as const, homePrefectureId: null };
  usersById.set(currentUser.id, currentUser);

  return (
    <AppShell subtitle={getRoleLabel(currentRole)} title="旅詳細">
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
