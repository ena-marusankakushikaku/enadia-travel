import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/common/AppShell';
import { SponsorCredit, SponsoredBadge } from '@/components/themes/SponsoredBadge';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/api/currentUser';
import { getDaysLeft, getThemePeriodState, mapSponsorRow, mapThemeTemplateRow } from '@/lib/api/themeTemplates';

export const dynamic = 'force-dynamic';

export default async function DiscoverThemesPage() {
  const supabase = createSupabaseServerClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    redirect('/auth/login');
  }

  const [{ data: templateRows }, { data: sponsorRows }, { data: joinedRows }, { data: spotRows }] =
    await Promise.all([
      supabase
        .from('theme_templates')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false }),
      supabase.from('sponsors').select('*'),
      supabase
        .from('conquest_projects')
        .select('id,template_id')
        .eq('user_id', user.id)
        .not('template_id', 'is', null),
      supabase.from('theme_spots').select('template_id')
    ]);

  const sponsorById = new Map((sponsorRows ?? []).map((row) => [row.id, mapSponsorRow(row)]));
  const joinedByTemplate = new Map(
    (joinedRows ?? []).map((row) => [row.template_id as string, row.id])
  );

  const spotCount: Record<string, number> = {};
  for (const row of spotRows ?? []) {
    spotCount[row.template_id] = (spotCount[row.template_id] ?? 0) + 1;
  }

  const templates = (templateRows ?? [])
    .map(mapThemeTemplateRow)
    .filter((template) => getThemePeriodState(template) !== 'ended');

  return (
    <AppShell subtitle="参加できるテーマ" title="みんなのテーマ">
      <div className="mb-4 flex gap-2">
        <Link
          className="rounded-full border border-enadia-line bg-white px-3 py-1.5 text-xs font-bold text-enadia-muted"
          href="/conquest"
        >
          マイテーマ
        </Link>
        <span className="rounded-full bg-enadia-primary px-3 py-1.5 text-xs font-bold text-white">
          みんなのテーマ
        </span>
      </div>

      {templates.length === 0 ? (
        <p className="rounded-lg border border-dashed border-enadia-line bg-white p-8 text-center text-sm text-enadia-muted">
          いま参加できるテーマはありません。
        </p>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => {
            const sponsor = template.sponsorId ? sponsorById.get(template.sponsorId) ?? null : null;
            const daysLeft = getDaysLeft(template);
            const joinedProjectId = joinedByTemplate.get(template.id);

            return (
              <Link
                className="block overflow-hidden rounded-lg border border-enadia-line bg-white shadow-sm"
                href={`/conquest/discover/${template.id}`}
                key={template.id}
              >
                <div
                  className="relative flex h-24 items-end p-3"
                  style={{
                    background: `linear-gradient(140deg, ${template.color}, ${template.color}99 60%, #ffffff33)`
                  }}
                >
                  {template.isSponsored ? (
                    <div className="absolute left-3 top-3">
                      <SponsoredBadge />
                    </div>
                  ) : null}
                  {daysLeft !== null ? (
                    <span className="absolute right-3 top-3 rounded bg-black/25 px-2 py-0.5 text-[10px] font-bold text-white">
                      のこり{daysLeft}日
                    </span>
                  ) : null}
                  <p className="text-base font-bold text-white drop-shadow">
                    {template.emoji} {template.title}
                  </p>
                </div>

                <div className="p-3">
                  {sponsor ? <SponsorCredit displayName={sponsor.displayName} /> : null}
                  <p className="mt-1 text-xs text-enadia-muted">
                    {template.areaLabel ? `${template.areaLabel} ・ ` : ''}
                    {template.kind === 'spot' ? `${spotCount[template.id] ?? 0}スポット` : '47都道府県'}
                  </p>
                  {joinedProjectId ? (
                    <span className="mt-2 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      参加中
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-enadia-muted">
        提供元のあるテーマには「PR」と表示しています。参加は無料で、参加しないことによる不利益はありません。
        配布されたテーマは、無料プランでもテーマ枠を消費しません。
      </p>
    </AppShell>
  );
}
