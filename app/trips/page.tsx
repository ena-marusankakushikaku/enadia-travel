import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Gift, Plus } from 'lucide-react';
import { AppShell } from '@/components/common/AppShell';
import { TripListClient, type TripListItem } from '@/components/trips/TripListClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/api/currentUser';
import { mapTripRow } from '@/lib/api/trips';
import { mapTripMemberRow } from '@/lib/api/tripMembers';
import { createSignedPhotoUrls } from '@/lib/api/photos';
import { mapProfileRow } from '@/lib/api/profiles';
import { touchLoginStreak } from '@/lib/api/loginStreak';
import { loadThemeHighlights } from '@/lib/themes/highlights';
import { ThemeHighlights } from '@/components/themes/ThemeHighlights';

export default async function TripsPage() {
  const supabase = createSupabaseServerClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    redirect('/auth/login');
  }

  // 一覧に必要なのは「旅ごとの枚数」と「表紙1枚」だけ。
  // 以前は写真の全項目を取ってすべての表示URLを発行していたため、
  // 写真が増えるほど画面が出るまで待たされる作りになっていた。
  const [
    { data: tripRows },
    { data: memberRows },
    { data: photoRows },
    { data: ownProfileRow },
    themeHighlights
  ] = await Promise.all([
    supabase.from('trips').select('*').order('created_at', { ascending: false }),
    supabase.from('trip_members').select('*'),
    supabase
      .from('photos')
      .select('id, trip_id, storage_path, thumbnail_path, captured_at, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    loadThemeHighlights(supabase, user.id)
  ]);

  const trips = (tripRows ?? []).map((row) =>
    mapTripRow(
      row,
      (memberRows ?? []).filter((member) => member.trip_id === row.id).map((member) => member.user_id)
    )
  );
  const members = (memberRows ?? []).map(mapTripMemberRow);

  // 旅ごとに、枚数と表紙にする1枚（いちばん新しい写真）を選ぶ
  const photoCountByTrip = new Map<string, number>();
  const coverPathByTrip = new Map<string, string>();
  for (const photo of photoRows ?? []) {
    photoCountByTrip.set(photo.trip_id, (photoCountByTrip.get(photo.trip_id) ?? 0) + 1);
    if (!coverPathByTrip.has(photo.trip_id)) {
      // サムネイルがあればそれを使う。無い写真（この仕組みの前のもの）は表示用で代用
      coverPathByTrip.set(photo.trip_id, photo.thumbnail_path ?? photo.storage_path);
    }
  }

  // 表示URLの発行は旅の数だけ。写真の枚数には影響されない
  const coverUrlByPath = await createSignedPhotoUrls(supabase, Array.from(coverPathByTrip.values()));

  const currentUser = ownProfileRow
    ? mapProfileRow(ownProfileRow)
    : { id: user.id, displayName: user.email ?? 'Traveler', avatarUrl: null, plan: 'free' as const, homePrefectureId: null };

  // 画面を開いた時点で「今日も開いた」と記録する。同じ日の2回目以降は書き込まない
  const currentStats = {
    loginStreakDays: await touchLoginStreak(
      supabase,
      user.id,
      ownProfileRow?.last_login_date ?? null,
      ownProfileRow?.login_streak_days ?? 0
    )
  };

  const items: TripListItem[] = trips.map((trip) => {
    const coverPath = coverPathByTrip.get(trip.id);
    return {
      trip,
      members: members.filter((member) => member.tripId === trip.id),
      photoCount: photoCountByTrip.get(trip.id) ?? 0,
      coverImageUrl: coverPath ? coverUrlByPath.get(coverPath) ?? null : null
    };
  });

  return (
    <AppShell subtitle="旅管理MVP" title="旅一覧">
      <section className="mb-5 overflow-hidden rounded-lg bg-enadia-ink text-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_20%_0%,rgba(15,139,141,0.55),transparent_32%),linear-gradient(135deg,#18212f,#243449)] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/68">ENADIA Travel</p>
          <h1 className="mt-2 text-2xl font-bold">写真から旅の価値を育てる</h1>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[11px] text-white/62">プラン</p>
              <p className="mt-1 text-sm font-bold uppercase">{currentUser.plan}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[11px] text-white/62">写真</p>
              <p className="mt-1 text-sm font-bold">{photoRows?.length ?? 0}枚</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[11px] text-white/62">連続ログイン</p>
              <p className="mt-1 text-sm font-bold">{currentStats.loginStreakDays}日</p>
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

      <ThemeHighlights available={themeHighlights.available} joined={themeHighlights.joined} />

      {currentUser.plan === 'free' ? (
        <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-bold">
            <Gift className="h-4 w-4" aria-hidden="true" />
            Freeプラン広告枠
          </div>
          <p className="mt-2">Proにすると広告非表示、AI整理、共有容量アップが使えます。</p>
        </section>
      ) : null}

      <TripListClient items={items} />
    </AppShell>
  );
}
