import { redirect } from 'next/navigation';
import { AppShell } from '@/components/common/AppShell';
import { ConquestPageClient } from '@/app/conquest/ConquestPageClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { mapConquestProjectRow } from '@/lib/api/conquestProjects';
import { mapConquestEntryRow } from '@/lib/api/conquestEntries';
import { attachPhotoImageUrls, mapPhotoRow } from '@/lib/api/photos';
import { mapProfileRow } from '@/lib/api/profiles';
import type { ConquestProject, UserProfile } from '@/types/app';

export default async function ConquestPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const [{ data: projectRows }, { data: entryRows }, { data: photoRows }, { data: profileRow }] = await Promise.all([
    supabase.from('conquest_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('conquest_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('photos').select('*').eq('uploaded_by', user.id),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  ]);

  const entries = (entryRows ?? []).map(mapConquestEntryRow);
  const projects: ConquestProject[] = (projectRows ?? []).map((row) => ({
    ...mapConquestProjectRow(row),
    entries: entries.filter((entry) => entry.projectId === row.id)
  }));
  const photos = await attachPhotoImageUrls(supabase, (photoRows ?? []).map(mapPhotoRow));
  const currentUser: UserProfile = profileRow
    ? mapProfileRow(profileRow)
    : { id: user.id, displayName: user.email ?? 'Traveler', avatarUrl: null, plan: 'free', homePrefectureId: null };

  return (
    <AppShell subtitle="テーマごとの全国制覇" title="制覇">
      <ConquestPageClient entries={entries} photos={photos} projects={projects} users={[currentUser]} />
    </AppShell>
  );
}
