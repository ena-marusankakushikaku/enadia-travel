import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';
import { ConquestDetail } from '@/components/conquest/ConquestDetail';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { mapConquestProjectRow } from '@/lib/api/conquestProjects';
import { mapConquestEntryRow } from '@/lib/api/conquestEntries';
import { attachPhotoImageUrls, mapPhotoRow } from '@/lib/api/photos';
import { mapProfileRow } from '@/lib/api/profiles';
import type { UserProfile } from '@/types/app';

type ConquestDetailPageProps = {
  params: { conquestId: string };
};

export default async function ConquestDetailPage({ params }: ConquestDetailPageProps) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: projectRow } = await supabase
    .from('conquest_projects')
    .select('*')
    .eq('id', params.conquestId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!projectRow) {
    return (
      <AppShell title="制覇テーマが見つかりません">
        <Link href="/conquest">
          <Button variant="secondary">制覇へ戻る</Button>
        </Link>
      </AppShell>
    );
  }

  const [{ data: entryRows }, { data: photoRows }, { data: profileRow }] = await Promise.all([
    supabase
      .from('conquest_entries')
      .select('*')
      .eq('project_id', params.conquestId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('photos').select('*').eq('uploaded_by', user.id),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  ]);

  const entries = (entryRows ?? []).map(mapConquestEntryRow);
  const project = { ...mapConquestProjectRow(projectRow), entries };
  const photos = await attachPhotoImageUrls(supabase, (photoRows ?? []).map(mapPhotoRow));
  const currentUser: UserProfile = profileRow
    ? mapProfileRow(profileRow)
    : { id: user.id, displayName: user.email ?? 'Traveler', avatarUrl: null, plan: 'free', homePrefectureId: null };

  return (
    <AppShell subtitle="制覇詳細" title={project.name}>
      <ConquestDetail photos={photos} project={project} userId={user.id} users={[currentUser]} />
    </AppShell>
  );
}
