import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { mapSponsorRow, mapThemeTemplateRow } from '@/lib/api/themeTemplates';
import { AdminThemeListClient } from '@/app/admin/themes/AdminThemeListClient';

export const dynamic = 'force-dynamic';

export default async function AdminThemesPage() {
  const supabase = createSupabaseServiceClient();

  const [{ data: templateRows }, { data: sponsorRows }, { data: spotRows }] = await Promise.all([
    supabase.from('theme_templates').select('*').order('created_at', { ascending: false }),
    supabase.from('sponsors').select('*').order('display_name'),
    supabase.from('theme_spots').select('template_id')
  ]);

  const spotCountByTemplate: Record<string, number> = {};
  for (const row of spotRows ?? []) {
    spotCountByTemplate[row.template_id] = (spotCountByTemplate[row.template_id] ?? 0) + 1;
  }

  return (
    <AdminThemeListClient
      sponsors={(sponsorRows ?? []).map(mapSponsorRow)}
      spotCountByTemplate={spotCountByTemplate}
      templates={(templateRows ?? []).map(mapThemeTemplateRow)}
    />
  );
}
