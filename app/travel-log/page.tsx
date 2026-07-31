import { redirect } from 'next/navigation';
import { AppShell } from '@/components/common/AppShell';
import { TravelLogClient } from '@/app/travel-log/TravelLogClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { mapTripRow } from '@/lib/api/trips';
import { attachPhotoImageUrls, attachPhotoInteractions, mapPhotoRow } from '@/lib/api/photos';
import { mapConquestProjectRow } from '@/lib/api/conquestProjects';
import { mapConquestEntryRow } from '@/lib/api/conquestEntries';
import { selectMemories } from '@/lib/memories/selectMemories';

/** 一度に読み込む写真の上限。増えすぎたときの保険 */
const PHOTO_LIMIT = 1000;

export default async function TravelLogPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // 写真はRLSにより「自分が参加している旅のもの」だけが返る
  const [{ data: photoRows }, { data: tripRows }, { data: memberRows }, { data: projectRows }, { data: entryRows }] =
    await Promise.all([
      supabase.from('photos').select('*').order('created_at', { ascending: false }).limit(PHOTO_LIMIT),
      supabase.from('trips').select('*').order('created_at', { ascending: false }),
      supabase.from('trip_members').select('*'),
      supabase.from('conquest_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('conquest_entries').select('*').eq('user_id', user.id)
    ]);

  const photosWithUrls = await attachPhotoImageUrls(supabase, (photoRows ?? []).map(mapPhotoRow));
  const photos = await attachPhotoInteractions(supabase, photosWithUrls, user.id);

  const trips = (tripRows ?? []).map((row) =>
    mapTripRow(
      row,
      (memberRows ?? []).filter((member) => member.trip_id === row.id).map((member) => member.user_id)
    )
  );

  const entries = (entryRows ?? []).map(mapConquestEntryRow);
  const projects = (projectRows ?? []).map((row) => ({
    ...mapConquestProjectRow(row),
    entries: entries.filter((entry) => entry.projectId === row.id)
  }));

  // 「今日」の判定はサーバー側で行い、表示が途中で変わらないようにする
  const memorySet = selectMemories(photos, new Date());

  return (
    <AppShell subtitle="旅をふりかえる" title="おもいで">
      <TravelLogClient
        currentUserId={user.id}
        entries={entries}
        memorySet={memorySet}
        photos={photos}
        projects={projects}
        trips={trips}
      />
    </AppShell>
  );
}
