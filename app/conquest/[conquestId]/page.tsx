import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';
import { ConquestDetail } from '@/components/conquest/ConquestDetail';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/api/currentUser';
import { mapConquestProjectRow } from '@/lib/api/conquestProjects';
import { mapConquestEntryRow } from '@/lib/api/conquestEntries';
import { attachPhotoImageUrls, mapPhotoRow, PHOTO_SELECT_COLUMNS } from '@/lib/api/photos';
import { mapProfileRow } from '@/lib/api/profiles';
import { collectEntryLocations } from '@/lib/conquest/progress';
import { mapSponsorRow, mapThemeSpotRow, mapThemeTemplateRow } from '@/lib/api/themeTemplates';
import { collectVisitedCountryCodes } from '@/constants/world';
import type { Sponsor, ThemeSpot, ThemeTemplate, UserProfile } from '@/types/app';

type ConquestDetailPageProps = {
  params: { conquestId: string };
};

export default async function ConquestDetailPage({ params }: ConquestDetailPageProps) {
  const supabase = createSupabaseServerClient();
  const user = await getCurrentUser(supabase);

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
    supabase.from('photos').select(PHOTO_SELECT_COLUMNS).eq('uploaded_by', user.id),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  ]);

  const entries = (entryRows ?? []).map(mapConquestEntryRow);
  const project = { ...mapConquestProjectRow(projectRow), entries };
  const photos = await attachPhotoImageUrls(supabase, (photoRows ?? []).map(mapPhotoRow));
  const currentUser: UserProfile = profileRow
    ? mapProfileRow(profileRow)
    : { id: user.id, displayName: user.email ?? 'Traveler', avatarUrl: null, plan: 'free', homePrefectureId: null };

  // 世界地図のデータは大きいので、国の数え上げはサーバー側で済ませる
  const overseasCountryCount = collectVisitedCountryCodes(collectEntryLocations(entries, photos)).filter(
    (code) => code !== 'JP'
  ).length;

  // 配布テーマ（template_id がある）なら、進み具合をスポット単位で出すために原本を読む
  let template: ThemeTemplate | null = null;
  let spots: ThemeSpot[] = [];
  let sponsor: Sponsor | null = null;

  if (project.templateId) {
    const { data: templateRow } = await supabase
      .from('theme_templates')
      .select('*')
      .eq('id', project.templateId)
      .maybeSingle();

    if (templateRow) {
      template = mapThemeTemplateRow(templateRow);

      const [{ data: spotRows }, { data: sponsorRow }] = await Promise.all([
        supabase.from('theme_spots').select('*').eq('template_id', template.id).order('order_no'),
        template.sponsorId
          ? supabase.from('sponsors').select('*').eq('id', template.sponsorId).maybeSingle()
          : Promise.resolve({ data: null })
      ]);

      spots = (spotRows ?? []).map(mapThemeSpotRow);
      sponsor = sponsorRow ? mapSponsorRow(sponsorRow) : null;
    }
  }

  return (
    <AppShell subtitle="制覇詳細" title={project.name}>
      <ConquestDetail
        overseasCountryCount={overseasCountryCount}
        photos={photos}
        project={project}
        sponsor={sponsor}
        spots={spots}
        template={template}
        userId={user.id}
        users={[currentUser]}
      />
    </AppShell>
  );
}
