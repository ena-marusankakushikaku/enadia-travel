import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/common/AppShell';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/api/currentUser';
import { mapSponsorRow, mapThemeSpotRow, mapThemeTemplateRow } from '@/lib/api/themeTemplates';
import { JoinThemeClient } from '@/app/conquest/discover/[templateId]/JoinThemeClient';

export const dynamic = 'force-dynamic';

export default async function ThemeDetailPage({ params }: { params: { templateId: string } }) {
  const supabase = createSupabaseServerClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    redirect('/auth/login');
  }

  const { data: templateRow } = await supabase
    .from('theme_templates')
    .select('*')
    .eq('id', params.templateId)
    .eq('status', 'published')
    .maybeSingle();

  if (!templateRow) {
    notFound();
  }

  const template = mapThemeTemplateRow(templateRow);

  const [{ data: spotRows }, { data: sponsorRow }, { data: joined }, { data: profile }] =
    await Promise.all([
      supabase.from('theme_spots').select('*').eq('template_id', template.id).order('order_no'),
      template.sponsorId
        ? supabase.from('sponsors').select('*').eq('id', template.sponsorId).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from('conquest_projects')
        .select('id')
        .eq('user_id', user.id)
        .eq('template_id', template.id)
        .maybeSingle(),
      supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle()
    ]);

  return (
    <AppShell subtitle={template.areaLabel ?? 'テーマの詳細'} title={template.title}>
      <JoinThemeClient
        joinedProjectId={joined?.id ?? null}
        plan={profile?.plan ?? 'free'}
        sponsor={sponsorRow ? mapSponsorRow(sponsorRow) : null}
        spots={(spotRows ?? []).map(mapThemeSpotRow)}
        template={template}
      />
    </AppShell>
  );
}
