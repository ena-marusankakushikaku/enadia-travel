import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin';
import { APP_SETTING_KEYS, APP_SETTING_RANGES, clampSetting, getAppSettingRows } from '@/lib/settings';
import type { AppSettingKey } from '@/types/app';

export async function GET() {
  const { response, supabase } = await requireAdmin();
  if (response || !supabase) return response;

  return NextResponse.json({ settings: await getAppSettingRows(supabase) });
}

/**
 * 数値パラメータの更新。
 *
 * 変えられるのは APP_SETTING_KEYS にあるものだけで、値も範囲に丸める。
 * 「機能そのものを管理画面からON/OFFする」ことは意図的にできないようにしてある
 * （課金との整合が崩れると「払っているのに使えない」が起きるため）。
 */
export async function PATCH(request: Request) {
  const { admin, response, supabase } = await requireAdmin();
  if (response || !supabase || !admin) return response;

  const body = (await request.json()) as { settings?: Record<string, number> };
  const input = body.settings ?? {};
  const updatedAt = new Date().toISOString();

  const targets = Object.entries(input).filter(([key]) =>
    APP_SETTING_KEYS.includes(key as AppSettingKey)
  );

  if (targets.length === 0) {
    return NextResponse.json({ error: '更新する項目がありません' }, { status: 400 });
  }

  for (const [key, rawValue] of targets) {
    const settingKey = key as AppSettingKey;
    const value = Number(rawValue);

    if (!Number.isFinite(value)) {
      return NextResponse.json({ error: `${key} は数値で指定してください` }, { status: 400 });
    }

    const range = APP_SETTING_RANGES[settingKey];
    if (value < range.min || value > range.max) {
      return NextResponse.json(
        { error: `${key} は ${range.min}〜${range.max} の範囲で指定してください` },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('app_settings')
      .update({ value: clampSetting(settingKey, value), updated_at: updatedAt, updated_by: admin.id })
      .eq('key', settingKey);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ settings: await getAppSettingRows(supabase) });
}
