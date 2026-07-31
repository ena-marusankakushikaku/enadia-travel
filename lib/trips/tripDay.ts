const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** 日付を指定し直したときに入れる時刻（日本時間の正午）。日付がずれにくい */
const NOON_JST_MS = 12 * 60 * 60 * 1000;

export type TripPhase = 'before' | 'during' | 'after' | 'unknown';

export type TripDayInfo = {
  phase: TripPhase;
  /** 旅行中のときだけ入る。1日目なら1 */
  dayNumber: number | null;
  /** 画面に出す短いラベル。例：「2日目」「旅行前」 */
  label: string;
};

export type TripDaySelection =
  | { kind: 'before' }
  | { kind: 'day'; day: number }
  | { kind: 'after' };

/** 日本時間で何日目か（同じ日なら同じ数値） */
function toJstDayNumber(value: string | Date): number | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.floor((date.getTime() + JST_OFFSET_MS) / DAY_MS);
}

/** 日本時間のその日の正午をISO文字列で返す */
function jstNoonIso(dayNumber: number): string {
  return new Date(dayNumber * DAY_MS - JST_OFFSET_MS + NOON_JST_MS).toISOString();
}

/** 旅の日数。開始日と終了日が同じなら1 */
export function getTripDayCount(startsAt: string, endsAt: string): number {
  const start = toJstDayNumber(startsAt);
  const end = toJstDayNumber(endsAt);

  if (start === null || end === null) {
    return 1;
  }

  return Math.max(1, Math.abs(end - start) + 1);
}

/**
 * 写真が旅の何日目かを判定する。
 * 旅の開始前なら「旅行前」、終了後なら「旅行後」。
 */
export function getTripDayInfo(photoDate: string, startsAt: string, endsAt: string): TripDayInfo {
  const photoDay = toJstDayNumber(photoDate);
  const startDay = toJstDayNumber(startsAt);
  const endDay = toJstDayNumber(endsAt);

  if (photoDay === null || startDay === null || endDay === null) {
    return { phase: 'unknown', dayNumber: null, label: '日付不明' };
  }

  // 開始日と終了日が逆に入っていても壊れないようにする
  const first = Math.min(startDay, endDay);
  const last = Math.max(startDay, endDay);

  if (photoDay < first) {
    return { phase: 'before', dayNumber: null, label: '旅行前' };
  }

  if (photoDay > last) {
    return { phase: 'after', dayNumber: null, label: '旅行後' };
  }

  const dayNumber = photoDay - first + 1;
  return { phase: 'during', dayNumber, label: `${dayNumber}日目` };
}

/**
 * 「旅行前・N日目・旅行後」の選択を、実際の日付（ISO文字列）に変換する。
 * 何日目かを別カラムで持たず日付ひとつに集約するため、保存はこの形で行う。
 */
export function dateForTripDay(startsAt: string, endsAt: string, selection: TripDaySelection): string | null {
  const startDay = toJstDayNumber(startsAt);
  const endDay = toJstDayNumber(endsAt);

  if (startDay === null || endDay === null) {
    return null;
  }

  const first = Math.min(startDay, endDay);
  const last = Math.max(startDay, endDay);

  if (selection.kind === 'before') {
    return jstNoonIso(first - 1);
  }

  if (selection.kind === 'after') {
    return jstNoonIso(last + 1);
  }

  if (!Number.isInteger(selection.day) || selection.day < 1) {
    return null;
  }

  return jstNoonIso(first + selection.day - 1);
}

export type TripDayGroup<T> = {
  /** グループを見分けるための文字列。'before' / 'day-2' / 'after' / 'unknown' */
  key: string;
  phase: TripPhase;
  dayNumber: number | null;
  label: string;
  items: T[];
  /** グループ内で一番古い日付・新しい日付（日付不明のグループはnull） */
  firstDate: string | null;
  lastDate: string | null;
};

/**
 * 写真を「旅行前・1日目・2日目…・旅行後・日付不明」でまとめる。
 *
 * 旅行前と旅行後は、日付が何日かに散らばっていてもひとつにまとめる。
 * 旅の本体ではないので、日付ごとに見出しが増えると逆に読みにくくなるため。
 */
export function groupByTripDay<T>(
  items: T[],
  getDate: (item: T) => string,
  startsAt: string,
  endsAt: string
): TripDayGroup<T>[] {
  const groups = new Map<string, TripDayGroup<T>>();

  for (const item of items) {
    const date = getDate(item);
    const info = getTripDayInfo(date, startsAt, endsAt);
    const key = info.phase === 'during' ? `day-${info.dayNumber}` : info.phase;

    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, {
        key,
        phase: info.phase,
        dayNumber: info.dayNumber,
        label: info.label,
        items: [item],
        firstDate: null,
        lastDate: null
      });
    }
  }

  const ordered = Array.from(groups.values());

  for (const group of ordered) {
    group.items.sort((a, b) => {
      const left = new Date(getDate(a)).getTime();
      const right = new Date(getDate(b)).getTime();
      if (Number.isNaN(left)) return 1;
      if (Number.isNaN(right)) return -1;
      return left - right;
    });

    if (group.phase !== 'unknown') {
      group.firstDate = getDate(group.items[0]);
      group.lastDate = getDate(group.items[group.items.length - 1]);
    }
  }

  // 旅行前 → 1日目 → 2日目 → … → 旅行後 → 日付不明 の順に並べる
  function orderOf(group: TripDayGroup<T>): number {
    if (group.phase === 'before') return -1;
    if (group.phase === 'during') return group.dayNumber ?? 0;
    if (group.phase === 'after') return Number.MAX_SAFE_INTEGER - 1;
    return Number.MAX_SAFE_INTEGER;
  }

  return ordered.sort((a, b) => orderOf(a) - orderOf(b));
}

export type TripRangeChange = {
  /** 旅行中だった写真のうち「旅行前」になる枚数 */
  toBefore: number;
  /** 旅行中だった写真のうち「旅行後」になる枚数 */
  toAfter: number;
};

/**
 * 旅の期間を変えたときに、すでにある写真が旅の外に押し出されるかを数える。
 *
 * 例：3日目の写真があるのに旅を2日間へ縮めると、その写真は「旅行後」に移る。
 * 黙って動かすと気づけないので、保存前に確認するために使う。
 */
export function describeTripRangeChange(
  dates: string[],
  current: { startsAt: string; endsAt: string },
  next: { startsAt: string; endsAt: string }
): TripRangeChange {
  let toBefore = 0;
  let toAfter = 0;

  for (const date of dates) {
    const before = getTripDayInfo(date, current.startsAt, current.endsAt);
    if (before.phase !== 'during') {
      // もともと旅の外にあった写真は、動いても驚きが無いので数えない
      continue;
    }

    const after = getTripDayInfo(date, next.startsAt, next.endsAt);
    if (after.phase === 'before') {
      toBefore += 1;
    } else if (after.phase === 'after') {
      toAfter += 1;
    }
  }

  return { toBefore, toAfter };
}

/** 現在の写真の日付から、選択欄の初期値を求める */
export function selectionFromDate(
  photoDate: string,
  startsAt: string,
  endsAt: string
): TripDaySelection | null {
  const info = getTripDayInfo(photoDate, startsAt, endsAt);

  if (info.phase === 'before') {
    return { kind: 'before' };
  }
  if (info.phase === 'after') {
    return { kind: 'after' };
  }
  if (info.phase === 'during' && info.dayNumber !== null) {
    return { kind: 'day', day: info.dayNumber };
  }

  return null;
}
