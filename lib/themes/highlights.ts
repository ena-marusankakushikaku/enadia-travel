import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import type { AvailableThemeSummary, JoinedThemeSummary } from '@/components/themes/ThemeHighlights';
import { getDaysLeft, getThemePeriodState, mapThemeTemplateRow } from '@/lib/api/themeTemplates';
import { PREFECTURE_TOTAL } from '@/lib/conquest/progress';

/**
 * ホームに出す「参加中のテーマ」と「参加できるテーマ」。
 *
 * 一覧の表示だけが目的なので、記録や写真の中身は取らず、
 * 件数を数えるのに必要な列だけを読む。
 */
export async function loadThemeHighlights(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ joined: JoinedThemeSummary[]; available: AvailableThemeSummary[] }> {
  const [{ data: templateRows }, { data: projectRows }, { data: sponsorRows }, { data: spotRows }] =
    await Promise.all([
      supabase.from('theme_templates').select('*').eq('status', 'published'),
      supabase
        .from('conquest_projects')
        .select('id,template_id,archived_at')
        .eq('user_id', userId)
        .not('template_id', 'is', null),
      supabase.from('sponsors').select('id,display_name'),
      supabase.from('theme_spots').select('id,template_id')
    ]);

  const templates = (templateRows ?? []).map(mapThemeTemplateRow);
  const sponsorNameById = new Map((sponsorRows ?? []).map((row) => [row.id, row.display_name]));

  const spotCount: Record<string, number> = {};
  for (const row of spotRows ?? []) {
    spotCount[row.template_id] = (spotCount[row.template_id] ?? 0) + 1;
  }

  const activeProjects = (projectRows ?? []).filter((row) => row.archived_at === null);
  const joinedTemplateIds = new Set((projectRows ?? []).map((row) => row.template_id as string));

  // 参加中テーマの達成数は、記録のスポットIDを数えて出す
  const projectIds = activeProjects.map((row) => row.id);
  const { data: entryRows } = projectIds.length
    ? await supabase
        .from('conquest_entries')
        .select('project_id,spot_id,prefecture_id')
        .in('project_id', projectIds)
    : { data: [] };

  const joined: JoinedThemeSummary[] = [];

  for (const project of activeProjects) {
    const template = templates.find((item) => item.id === project.template_id);
    if (!template) {
      continue;
    }

    const entries = (entryRows ?? []).filter((row) => row.project_id === project.id);

    const isSpot = template.kind === 'spot';
    const achieved = isSpot
      ? new Set(entries.map((row) => row.spot_id).filter((id): id is string => Boolean(id))).size
      : new Set(entries.map((row) => row.prefecture_id).filter((id): id is number => id !== null)).size;

    joined.push({
      projectId: project.id,
      title: template.title,
      emoji: template.emoji,
      color: template.color,
      isSponsored: template.isSponsored,
      sponsorName: template.sponsorId ? sponsorNameById.get(template.sponsorId) ?? null : null,
      achieved,
      total: isSpot ? spotCount[template.id] ?? 0 : PREFECTURE_TOTAL,
      unit: isSpot ? 'スポット' : '県',
      daysLeft: getDaysLeft(template)
    });
  }

  const available: AvailableThemeSummary[] = templates
    .filter((template) => !joinedTemplateIds.has(template.id))
    .filter((template) => getThemePeriodState(template) !== 'ended')
    .map((template) => ({
      templateId: template.id,
      title: template.title,
      emoji: template.emoji,
      isSponsored: template.isSponsored,
      sponsorName: template.sponsorId ? sponsorNameById.get(template.sponsorId) ?? null : null,
      spotCount: spotCount[template.id] ?? 0,
      daysLeft: getDaysLeft(template)
    }));

  return { joined, available };
}
