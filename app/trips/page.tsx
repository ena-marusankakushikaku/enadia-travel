import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Gift, Plus } from 'lucide-react';
import { AppShell } from '@/components/common/AppShell';
import { TripListClient, type TripListItem } from '@/components/trips/TripListClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { mapTripRow } from '@/lib/api/trips';
import { mapTripMemberRow } from '@/lib/api/tripMembers';
import { attachPhotoImageUrls, mapPhotoRow } from '@/lib/api/photos';
import { mapProfileRow, mapPublicProfileRow } from '@/lib/api/profiles';
import type { UserProfile } from '@/types/app';

export default async function TripsPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const [{ data: tripRows }, { data: memberRows }, { data: photoRows }, { data: ownProfileRow }] = await Promise.all([
    supabase.from('trips').select('*').order('created_at', { ascending: false }),
    supabase.from('trip_members').select('*'),
    supabase.from('photos').select('*'),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  ]);

  const trips = (tripRows ?? []).map((row) =>
    mapTripRow(
      row,
      (memberRows ?? []).filter((member) => member.trip_id === row.id).map((member) => member.user_id)
    )
  );
  const members = (memberRows ?? []).map(mapTripMemberRow);
  const photos = await attachPhotoImageUrls(supabase, (photoRows ?? []).map(mapPhotoRow));

  const memberUserIds = Array.from(new Set(members.map((member) => member.userId)));
  const { data: publicProfileRows } = memberUserIds.length
    ? await supabase.from('public_profiles').select('*').in('id', memberUserIds)
    : { data: [] };

  const usersById = new Map<string, UserProfile>((publicProfileRows ?? []).map((row) => [row.id, mapPublicProfileRow(row)]));
  const currentUser = ownProfileRow
    ? mapProfileRow(ownProfileRow)
    : { id: user.id, displayName: user.email ?? 'Traveler', avatarUrl: null, plan: 'free' as const, homePrefectureId: null };
  usersById.set(currentUser.id, currentUser);
  const users = Array.from(usersById.values());

  const currentStats = {
    points: ownProfileRow?.points ?? 0,
    // Login streak isn't tracked in the DB yet; falls back to 0 until that's built.
    loginStreakDays: 0
  };

  const items: TripListItem[] = trips.map((trip) => ({
    trip,
    members: members.filter((member) => member.tripId === trip.id),
    photos: photos.filter((photo) => photo.tripId === trip.id)
  }));

  return (
    <AppShell subtitle="旅管理MVP" title="旅一覧">
      <section className="mb-5 overflow-hidden rounded-lg bg-enadia-ink text-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_20%_0%,rgba(15,139,141,0.55),transparent_32%),linear-gradient(135deg,#18212f,#243449)] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/68">ENADIA Travel</p>
          <h1 className="mt-2 text-2xl font-bold">写真から旅の価値を育てる</h1>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[11px] text-white/62">Plan</p>
              <p className="mt-1 text-sm font-bold uppercase">{currentUser.plan}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[11px] text-white/62">Points</p>
              <p className="mt-1 text-sm font-bold">{currentStats.points.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[11px] text-white/62">Streak</p>
              <p className="mt-1 text-sm font-bold">{currentStats.loginStreakDays} days</p>
            </div>
          </div>
          <Link
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-enadia-primary px-4 text-sm font-semibold text-white transition hover:bg-enadia-primaryDark"
            href="/trips/new"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            新しい旅を作成
          </Link>
        </div>
      </section>

      {currentUser.plan === 'free' ? (
        <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-bold">
            <Gift className="h-4 w-4" aria-hidden="true" />
            Freeプラン広告枠
          </div>
          <p className="mt-2">Proにすると広告非表示、AI整理、共有容量アップが使えます。</p>
        </section>
      ) : null}

      <TripListClient items={items} users={users} />
    </AppShell>
  );
}
