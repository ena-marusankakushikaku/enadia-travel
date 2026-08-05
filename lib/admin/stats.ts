import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

/**
 * 管理画面のダッシュボード用の集計。
 *
 * いまは利用者が数十人規模なので、行をそのまま取ってきてサーバー側で数えている。
 * 数千人を超えたら、日次で集計テーブルに書き出す形に変える。
 * その判断がしやすいように、集計はすべてこのファイルに閉じ込めてある。
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export type OverviewStats = {
  userCount: number;
  newUsersLast30d: number;
  activeUsersLast30d: number;
  tripCount: number;
  photoCount: number;
  entryCount: number;
  /** 旅を2回以上記録した人の割合（目標40%） */
  repeatTripRate: number;
  /** テーマ記録を1件以上作った人の割合（目標50%） */
  themeEntryRate: number;
  /** 有料プランの人数 */
  paidUserCount: number;
};

export type ThemeStats = {
  templateId: string;
  title: string;
  status: string;
  isSponsored: boolean;
  sponsorName: string | null;
  spotCount: number;
  participantCount: number;
  completedCount: number;
  completionRate: number;
  entryCount: number;
  averageRating: number | null;
  spots: {
    spotId: string;
    name: string;
    reachedCount: number;
    averageRating: number | null;
  }[];
};

function rate(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

export async function loadOverviewStats(
  supabase: SupabaseClient<Database>,
  now: Date = new Date()
): Promise<OverviewStats> {
  const since = new Date(now.getTime() - 30 * DAY_MS).toISOString();

  const [profiles, trips, photos, entries, events] = await Promise.all([
    supabase.from('profiles').select('id,plan,created_at'),
    supabase.from('trips').select('owner_id'),
    supabase.from('photos').select('id', { count: 'exact', head: true }),
    supabase.from('conquest_entries').select('user_id'),
    supabase.from('tourism_events').select('user_id').gte('created_at', since)
  ]);

  const profileRows = profiles.data ?? [];
  const tripRows = trips.data ?? [];
  const entryRows = entries.data ?? [];

  const tripCountByUser = new Map<string, number>();
  for (const row of tripRows) {
    tripCountByUser.set(row.owner_id, (tripCountByUser.get(row.owner_id) ?? 0) + 1);
  }

  const usersWithEntries = new Set(entryRows.map((row) => row.user_id));
  const activeUsers = new Set((events.data ?? []).map((row) => row.user_id));
  const repeatUsers = [...tripCountByUser.values()].filter((count) => count >= 2).length;

  return {
    userCount: profileRows.length,
    newUsersLast30d: profileRows.filter((row) => row.created_at >= since).length,
    activeUsersLast30d: activeUsers.size,
    tripCount: tripRows.length,
    photoCount: photos.count ?? 0,
    entryCount: entryRows.length,
    repeatTripRate: rate(repeatUsers, profileRows.length),
    themeEntryRate: rate(usersWithEntries.size, profileRows.length),
    paidUserCount: profileRows.filter((row) => row.plan !== 'free').length
  };
}

export async function loadThemeStats(
  supabase: SupabaseClient<Database>
): Promise<ThemeStats[]> {
  const [templates, spots, projects, entries, sponsors] = await Promise.all([
    supabase
      .from('theme_templates')
      .select('id,title,status,is_sponsored,sponsor_id')
      .order('created_at', { ascending: false }),
    supabase.from('theme_spots').select('id,template_id,name,order_no'),
    supabase.from('conquest_projects').select('id,template_id,completed_at').not('template_id', 'is', null),
    supabase.from('conquest_entries').select('project_id,spot_id,rating').not('spot_id', 'is', null),
    supabase.from('sponsors').select('id,display_name')
  ]);

  const sponsorNameById = new Map((sponsors.data ?? []).map((row) => [row.id, row.display_name]));
  const projectRows = projects.data ?? [];
  const entryRows = entries.data ?? [];

  const templateIdByProjectId = new Map(
    projectRows.map((row) => [row.id, row.template_id as string])
  );

  return (templates.data ?? []).map((template) => {
    const templateSpots = (spots.data ?? [])
      .filter((spot) => spot.template_id === template.id)
      .sort((a, b) => a.order_no - b.order_no);

    const templateProjects = projectRows.filter((row) => row.template_id === template.id);
    const templateEntries = entryRows.filter(
      (row) => templateIdByProjectId.get(row.project_id) === template.id
    );

    const completedCount = templateProjects.filter((row) => row.completed_at !== null).length;
    const ratings = templateEntries
      .map((row) => (row.rating === null ? null : Number(row.rating)))
      .filter((value): value is number => value !== null && Number.isFinite(value));

    return {
      templateId: template.id,
      title: template.title,
      status: template.status,
      isSponsored: template.is_sponsored,
      sponsorName: template.sponsor_id ? sponsorNameById.get(template.sponsor_id) ?? null : null,
      spotCount: templateSpots.length,
      participantCount: templateProjects.length,
      completedCount,
      completionRate: rate(completedCount, templateProjects.length),
      entryCount: templateEntries.length,
      averageRating: average(ratings),
      spots: templateSpots.map((spot) => {
        const spotEntries = templateEntries.filter((row) => row.spot_id === spot.id);
        const spotRatings = spotEntries
          .map((row) => (row.rating === null ? null : Number(row.rating)))
          .filter((value): value is number => value !== null && Number.isFinite(value));

        return {
          spotId: spot.id,
          name: spot.name,
          // 同じ人が同じスポットで複数回記録することがあるので、人単位ではなく記録件数で数える
          reachedCount: spotEntries.length,
          averageRating: average(spotRatings)
        };
      })
    };
  });
}
