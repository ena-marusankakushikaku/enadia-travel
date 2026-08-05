import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppSettingKey, AppSettingRow, AppSettings } from '@/types/app';
import type { Database } from '@/types/db';

/**
 * 設定値の既定値。
 *
 * app_settings に行が無くても、この値でアプリが動く。
 * DBの都合でアプリが止まらないようにするための保険で、
 * 「設定が読めなければ安全側（無料の範囲は今までどおり）」に倒している。
 */
export const DEFAULT_APP_SETTINGS: AppSettings = {
  free_theme_limit: 1,
  free_theme_unlimited_days: 30,
  free_taste_insight_months: 12,
  free_taste_insight_top_n: 3,
  free_export_per_month: 1,
  spot_default_radius_m: 300,
  report_min_group_size: 5
};

/**
 * 管理画面で変えてよい範囲。
 *
 * ここに無いものは管理画面から変えられない。
 * 「動画書き出しはProだけ」のような機能そのもののON/OFFを管理画面に置かないのは、
 * 課金との整合が崩れたときに「払っているのに使えない」が起きるうえ、
 * テストすべき組み合わせが一気に増えるため。可変にするのは数値だけにする。
 */
export const APP_SETTING_RANGES: Record<AppSettingKey, { min: number; max: number }> = {
  free_theme_limit: { min: 0, max: 10 },
  free_theme_unlimited_days: { min: 0, max: 365 },
  free_taste_insight_months: { min: 1, max: 120 },
  free_taste_insight_top_n: { min: 1, max: 50 },
  // 0にすると「いつでも持ち出せる」という約束が守れなくなるので下限は1
  free_export_per_month: { min: 1, max: 100 },
  spot_default_radius_m: { min: 50, max: 5000 },
  // 個人が特定されないための下限。これを下げると利用規約 第13条3項に反する
  report_min_group_size: { min: 5, max: 100 }
};

export const APP_SETTING_KEYS = Object.keys(DEFAULT_APP_SETTINGS) as AppSettingKey[];

function toNumber(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
}

export function clampSetting(key: AppSettingKey, value: number): number {
  const range = APP_SETTING_RANGES[key];
  return Math.min(range.max, Math.max(range.min, Math.round(value)));
}

export async function getAppSettings(supabase: SupabaseClient<Database>): Promise<AppSettings> {
  const { data, error } = await supabase.from('app_settings').select('key,value');

  if (error || !data) {
    return { ...DEFAULT_APP_SETTINGS };
  }

  const settings = { ...DEFAULT_APP_SETTINGS };

  for (const row of data) {
    const key = row.key as AppSettingKey;
    if (!(key in settings)) {
      continue;
    }

    const parsed = toNumber(row.value);
    if (parsed !== null) {
      settings[key] = clampSetting(key, parsed);
    }
  }

  return settings;
}

export async function getAppSettingRows(
  supabase: SupabaseClient<Database>
): Promise<AppSettingRow[]> {
  const { data } = await supabase
    .from('app_settings')
    .select('key,value,label,description,updated_at')
    .order('key');

  return (data ?? [])
    .filter((row) => APP_SETTING_KEYS.includes(row.key as AppSettingKey))
    .map((row) => ({
      key: row.key as AppSettingKey,
      value: toNumber(row.value) ?? DEFAULT_APP_SETTINGS[row.key as AppSettingKey],
      label: row.label,
      description: row.description,
      updatedAt: row.updated_at
    }));
}

/**
 * 無料プランで、いま新しく自作テーマを作れるか。
 *
 * 数えるのは自作テーマ（template_id が NULL）だけ。
 * 配布テーマは何個参加しても枠を消費しない。
 * ここを枠に含めると、スポンサーに「参加者は全ユーザーです」と言えなくなり、
 * 商品として成立しなくなる。
 */
export function canCreateOwnTheme(params: {
  plan: string;
  settings: AppSettings;
  ownThemeCount: number;
  accountCreatedAt: string | Date;
  now?: Date;
}): { allowed: boolean; reason: 'pro' | 'trial' | 'within_limit' | 'limit_reached'; limit: number } {
  const { accountCreatedAt, ownThemeCount, plan, settings } = params;
  const now = params.now ?? new Date();

  if (plan !== 'free') {
    return { allowed: true, reason: 'pro', limit: Number.POSITIVE_INFINITY };
  }

  const createdAt = new Date(accountCreatedAt);
  const elapsedDays = (now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000);

  if (elapsedDays < settings.free_theme_unlimited_days) {
    return { allowed: true, reason: 'trial', limit: Number.POSITIVE_INFINITY };
  }

  const limit = settings.free_theme_limit;
  return {
    allowed: ownThemeCount < limit,
    reason: ownThemeCount < limit ? 'within_limit' : 'limit_reached',
    limit
  };
}
