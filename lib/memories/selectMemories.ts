import type { Photo } from '@/types/app';

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** 「この時期」とみなす前後の日数 */
const NEARBY_DAYS = 3;
/** シャッフルで見せたい枚数。1日分がこれに満たなければ他の日からも混ぜる */
const SHUFFLE_TARGET = 8;

export type MemoryKind = 'onThisDay' | 'lastYear' | 'monthsAgo' | 'shuffle';

export type MemorySet = {
  kind: MemoryKind;
  /** 見出し。例：「あの頃の今日」 */
  title: string;
  /** 補足。例：「2025年・2024年の7月29日」 */
  subtitle: string;
  photos: Photo[];
};

type JstParts = { year: number; month: number; day: number };

function toJstParts(date: Date): JstParts {
  const shifted = new Date(date.getTime() + JST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate()
  };
}

/** 日本時間で何日目か（同じ日なら同じ数値になる） */
function toJstDayNumber(date: Date): number {
  return Math.floor((date.getTime() + JST_OFFSET_MS) / DAY_MS);
}

function fromJstParts(parts: JstParts): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day) - JST_OFFSET_MS);
}

function getPhotoDate(photo: Photo): Date | null {
  const parsed = new Date(photo.capturedAt ?? photo.ts);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** 件数が多いときに、期間全体が伝わるよう均等に間引く */
function pickSpread<T>(items: T[], max: number): T[] {
  if (items.length <= max) {
    return items;
  }

  const step = (items.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, index) => items[Math.round(index * step)]);
}

function sortByDateAsc(photos: Photo[]): Photo[] {
  return [...photos].sort((a, b) => {
    const left = getPhotoDate(a)?.getTime() ?? 0;
    const right = getPhotoDate(b)?.getTime() ?? 0;
    return left - right;
  });
}

function formatYearMonthDay(parts: JstParts): string {
  return `${parts.year}年${parts.month}月${parts.day}日`;
}

/** 写真IDから決まる数値。同じ日なら毎回同じ並びになるようにするために使う */
function hashPhotoId(id: string, seed: number): number {
  let hash = seed >>> 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = Math.imul(hash ^ id.charCodeAt(index), 2654435761) >>> 0;
  }
  return hash;
}

/**
 * 振り返り用の写真をひと組選ぶ。
 *
 * 新しいアプリでは「同じ月日の過去の写真」が存在しないことが普通なので、
 * 同月同日 → 1年前のこの時期 → 3か月前のこの時期 → シャッフル、と段階的に条件をゆるめる。
 * どれも見つからなければ null（＝まだ振り返れる写真が無い）を返す。
 *
 * シャッフルは日付を種にしているため、同じ日は何度開いても同じ結果になり、翌日には変わる。
 */
export function selectMemories(photos: Photo[], now: Date, maxPhotos = 20): MemorySet | null {
  const today = toJstParts(now);
  const todayDayNumber = toJstDayNumber(now);

  const dated = photos
    .map((photo) => {
      const date = getPhotoDate(photo);
      return date ? { photo, date, parts: toJstParts(date), dayNumber: toJstDayNumber(date) } : null;
    })
    .filter((item): item is { photo: Photo; date: Date; parts: JstParts; dayNumber: number } => item !== null)
    // 今日より前の写真だけを振り返りの対象にする
    .filter((item) => item.dayNumber < todayDayNumber);

  if (dated.length === 0) {
    return null;
  }

  // 1. 過去の同じ月日
  const onThisDay = dated.filter((item) => item.parts.month === today.month && item.parts.day === today.day);
  if (onThisDay.length > 0) {
    const years = Array.from(new Set(onThisDay.map((item) => item.parts.year))).sort((a, b) => b - a);
    return {
      kind: 'onThisDay',
      title: 'あの頃の今日',
      subtitle: `${years.join('年・')}年の${today.month}月${today.day}日`,
      photos: pickSpread(sortByDateAsc(onThisDay.map((item) => item.photo)), maxPhotos)
    };
  }

  // 2. 1年前のこの時期（前後3日）
  const lastYearDayNumber = toJstDayNumber(
    fromJstParts({ year: today.year - 1, month: today.month, day: today.day })
  );
  const lastYear = dated.filter((item) => Math.abs(item.dayNumber - lastYearDayNumber) <= NEARBY_DAYS);
  if (lastYear.length > 0) {
    return {
      kind: 'lastYear',
      title: '1年前のこの時期',
      subtitle: `${today.year - 1}年${today.month}月ごろ`,
      photos: pickSpread(sortByDateAsc(lastYear.map((item) => item.photo)), maxPhotos)
    };
  }

  // 3. 3か月前のこの時期（前後3日）
  const threeMonthsAgo = new Date(now.getTime());
  threeMonthsAgo.setUTCMonth(threeMonthsAgo.getUTCMonth() - 3);
  const threeMonthsAgoDayNumber = toJstDayNumber(threeMonthsAgo);
  const monthsAgo = dated.filter((item) => Math.abs(item.dayNumber - threeMonthsAgoDayNumber) <= NEARBY_DAYS);
  if (monthsAgo.length > 0) {
    const parts = toJstParts(threeMonthsAgo);
    return {
      kind: 'monthsAgo',
      title: '3か月前のこの時期',
      subtitle: `${parts.year}年${parts.month}月ごろ`,
      photos: pickSpread(sortByDateAsc(monthsAgo.map((item) => item.photo)), maxPhotos)
    };
  }

  // 4. シャッフル
  // まず1日を選び、その日の枚数が少なければ他の日の写真も混ぜて見応えを出す
  const dayNumbers = Array.from(new Set(dated.map((item) => item.dayNumber))).sort((a, b) => a - b);
  const chosenDayNumber = dayNumbers[todayDayNumber % dayNumbers.length];
  const sameDay = dated.filter((item) => item.dayNumber === chosenDayNumber);

  if (sameDay.length >= SHUFFLE_TARGET) {
    return {
      kind: 'shuffle',
      title: 'おもいでシャッフル',
      subtitle: formatYearMonthDay(sameDay[0].parts),
      photos: pickSpread(sortByDateAsc(sameDay.map((item) => item.photo)), maxPhotos)
    };
  }

  // 同じ日を優先しつつ、残りを他の日から日替わりの順序で補う
  const others = dated
    .filter((item) => item.dayNumber !== chosenDayNumber)
    .sort((a, b) => hashPhotoId(a.photo.id, todayDayNumber) - hashPhotoId(b.photo.id, todayDayNumber));

  const picked = [...sameDay, ...others].slice(0, Math.min(SHUFFLE_TARGET, dated.length));
  const sorted = sortByDateAsc(picked.map((item) => item.photo));
  const usedDays = new Set(picked.map((item) => item.dayNumber));

  const first = picked.reduce((oldest, item) => (item.dayNumber < oldest.dayNumber ? item : oldest), picked[0]);
  const last = picked.reduce((newest, item) => (item.dayNumber > newest.dayNumber ? item : newest), picked[0]);

  return {
    kind: 'shuffle',
    title: 'おもいでシャッフル',
    subtitle:
      usedDays.size === 1
        ? formatYearMonthDay(first.parts)
        : `${formatYearMonthDay(first.parts)} 〜 ${formatYearMonthDay(last.parts)}`,
    photos: pickSpread(sorted, maxPhotos)
  };
}
