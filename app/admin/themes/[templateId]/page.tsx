import { notFound } from 'next/navigation';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { mapSponsorRow, mapThemeSpotRow, mapThemeTemplateRow } from '@/lib/api/themeTemplates';
import { getAppSettings } from '@/lib/settings';
import { AdminThemeEditorClient } from '@/app/admin/themes/[templateId]/AdminThemeEditorClient';

export const dynamic = 'force-dynamic';

export default async function AdminThemeEditorPage({
  params
}: {
  params: { templateId: string };
}) {
  const supabase = createSupabaseServiceClient();

  const { data: templateRow } = await supabase
    .from('theme_templates')
    .select('*')
    .eq('id', params.templateId)
    .maybeSingle();

  if (!templateRow) {
    notFound();
  }

  const [{ data: spotRows }, { data: sponsorRows }, { count: participantCount }, settings] =
    await Promise.all([
      supabase.from('theme_spots').select('*').eq('template_id', params.templateId).order('order_no'),
      supabase.from('sponsors').select('*').order('display_name'),
      supabase
        .from('conquest_projects')
        .select('id', { count: 'exact', head: true })
        .eq('template_id', params.templateId),
      getAppSettings(supabase)
    ]);

  return (
    <AdminThemeEditorClient
      defaultRadiusM={settings.spot_default_radius_m}
      participantCount={participantCount ?? 0}
      sponsors={(sponsorRows ?? []).map(mapSponsorRow)}
      spots={(spotRows ?? []).map(mapThemeSpotRow)}
      template={mapThemeTemplateRow(templateRow)}
    />
  );
}
