import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 日本時間での「YYYY-MM-DD」 */
export function jstDateKey(date: Date): string {
  return new Date(date.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * 前回開いた日と今日から、連続ログイン日数を求める。
 *
 * - 初めて開いた日は 1（0にはならない）
 * - 同じ日にもう一度開いても増えない
 * - 昨日も開いていれば +1
 * - 1日でも空いたら 1 に戻る
 *
 * 日付だけで判断するため、時刻や実行環境のタイムゾーンに左右されない。
 */
export function nextLoginStreak(
  lastLoginDate: string | null,
  currentStreak: number,
  now: Date
): { streak: number; dateKey: string; changed: boolean } {
  const dateKey = jstDateKey(now);
  const yesterdayKey = jstDateKey(new Date(now.getTime() - DAY_MS));

  // 「2026-07-31T00:00:00Z」のような形で入っていても日付部分だけを見る
  const lastKey = lastLoginDate ? lastLoginDate.slice(0, 10) : null;

  if (lastKey === dateKey) {
    const streak = Math.max(1, currentStreak);
    return { streak, dateKey, changed: streak !== currentStreak };
  }

  if (lastKey === yesterdayKey) {
    return { streak: Math.max(1, currentStreak) + 1, dateKey, changed: true };
  }

  return { streak: 1, dateKey, changed: true };
}

/**
 * 今日アプリを開いたことを記録し、連続ログイン日数を返す。
 *
 * 画面を表示するたびに呼ばれるが、同じ日の2回目以降は書き込まない。
 * 記録に失敗しても画面は出したいので、失敗時は計算結果だけ返す。
 */
export async function touchLoginStreak(
  supabase: SupabaseClient<Database>,
  userId: string,
  lastLoginDate: string | null,
  currentStreak: number,
  now: Date = new Date()
): Promise<number> {
  const { changed, dateKey, streak } = nextLoginStreak(lastLoginDate, currentStreak, now);

  if (!changed) {
    return streak;
  }

  await supabase
    .from('profiles')
    .update({ last_login_date: dateKey, login_streak_days: streak })
    .eq('id', userId);

  return streak;
}
