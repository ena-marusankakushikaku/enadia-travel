import type { ConquestEntry, ThemeKind, ThemeSpot } from '@/types/app';
import { PREFECTURE_TOTAL, countAchievedPrefectures } from '@/lib/conquest/progress';

const EARTH_RADIUS_M = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * 2点間の距離（メートル）。
 *
 * 半径300m程度の判定に使うだけなので、地球を球とみなす簡単な式（Haversine）で足りる。
 * 外部サービスに問い合わせないので、オフラインでも動くし課金も発生しない。
 */
export function distanceInMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type SpotMatch = {
  spot: ThemeSpot;
  distanceM: number;
};

/**
 * 座標がどのスポットの範囲に入っているかを探す。
 *
 * 複数のスポットが近接している場合（駅前など）は、いちばん近いものを採用する。
 * どれにも入っていなければ null。
 */
export function findReachedSpot(
  point: { lat: number; lng: number },
  spots: ThemeSpot[]
): SpotMatch | null {
  let best: SpotMatch | null = null;

  for (const spot of spots) {
    const distanceM = distanceInMeters(point, spot);

    if (distanceM > spot.radiusM) {
      continue;
    }

    if (!best || distanceM < best.distanceM) {
      best = { spot, distanceM };
    }
  }

  return best;
}

/** どのスポットにも入っていないときに「いちばん近い未到達スポット」を出すため */
export function findNearestSpot(
  point: { lat: number; lng: number },
  spots: ThemeSpot[]
): SpotMatch | null {
  let best: SpotMatch | null = null;

  for (const spot of spots) {
    const distanceM = distanceInMeters(point, spot);
    if (!best || distanceM < best.distanceM) {
      best = { spot, distanceM };
    }
  }

  return best;
}

export type ThemeProgress = {
  /** 達成した数 */
  achieved: number;
  /** 目標の数 */
  total: number;
  /** 0〜100 */
  percent: number;
  /** 画面に出す単位。「県」または「スポット」 */
  unit: string;
  isCompleted: boolean;
};

/**
 * テーマの進み具合。
 *
 * 都道府県型（area）とスポット型（spot）で分母も分子も違うので、
 * 分岐はここ1か所にまとめる。画面側は返ってきた achieved / total / unit を出すだけにする。
 * 画面ごとに計算を書くと、必ずどこかで食い違う。
 */
export function calcThemeProgress(
  kind: ThemeKind,
  entries: ConquestEntry[],
  spots: ThemeSpot[]
): ThemeProgress {
  if (kind === 'spot') {
    const total = spots.length;
    const reachedSpotIds = new Set(
      entries.map((entry) => entry.spotId).filter((id): id is string => Boolean(id))
    );
    const achieved = spots.filter((spot) => reachedSpotIds.has(spot.id)).length;

    return {
      achieved,
      total,
      percent: total === 0 ? 0 : Math.round((achieved / total) * 100),
      unit: 'スポット',
      isCompleted: total > 0 && achieved >= total
    };
  }

  const achieved = countAchievedPrefectures(entries);

  return {
    achieved,
    total: PREFECTURE_TOTAL,
    percent: Math.round((achieved / PREFECTURE_TOTAL) * 100),
    unit: '県',
    isCompleted: achieved >= PREFECTURE_TOTAL
  };
}
