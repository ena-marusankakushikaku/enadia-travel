import {
  WORLD_COUNTRY_SHAPES,
  projectToWorldMap,
  type CountryShape
} from '@/constants/worldMapShapes';

export type CountryBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

/**
 * 国ごとの外接矩形。内外判定の前にここで大半をふるい落とす。
 * データから計算できるので、生成ファイルには持たせていない。
 */
const BOUNDS_BY_CODE = new Map<string, CountryBounds>();
const SHAPE_BY_CODE = new Map<string, CountryShape>();

for (const shape of WORLD_COUNTRY_SHAPES) {
  SHAPE_BY_CODE.set(shape.code, shape);

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const ring of shape.rings) {
    for (let index = 0; index < ring.length; index += 2) {
      const x = ring[index];
      const y = ring[index + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  BOUNDS_BY_CODE.set(shape.code, { minX, minY, maxX, maxY });
}

/** 海岸線を簡略化したことで陸地から外れた点を拾うための許容距離（地図座標。約40km） */
const COASTAL_TOLERANCE = 0.8;

/**
 * 輪郭の内側かどうかを判定する（レイキャスティング法）。
 * 座標は投影後の値だが、正距円筒図法は経度・緯度をそのまま比例配分するだけなので、
 * 緯度経度で判定した場合と結果は変わらない。
 */
function isInsideRing(ring: number[], x: number, y: number): boolean {
  let inside = false;

  for (let index = 0, previous = ring.length - 2; index < ring.length; previous = index, index += 2) {
    const xi = ring[index];
    const yi = ring[index + 1];
    const xj = ring[previous];
    const yj = ring[previous + 1];

    const straddles = yi > y !== yj > y;
    if (straddles && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

/** 点と輪郭の距離の目安（頂点までの最短距離） */
function distanceToRing(ring: number[], x: number, y: number): number {
  let best = Number.POSITIVE_INFINITY;

  for (let index = 0; index < ring.length; index += 2) {
    const dx = ring[index] - x;
    const dy = ring[index + 1] - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < best) {
      best = distance;
    }
  }

  return best;
}

/**
 * 緯度経度から国コード（ISO 3166-1 alpha-2）を求める。
 *
 * 写真には国の情報を保存していないので、地図データから毎回計算している。
 * DBに列を増やさずに済み、後から地図データを差し替えても自動で追随する。
 *
 * 海岸ぎりぎりで撮った写真は、簡略化した輪郭の外に出てしまうことがある。
 * そのときは一番近い国に寄せる（約40kmまで）。
 */
export function findCountryCode(lat: number | null, lng: number | null): string | null {
  if (lat === null || lng === null) {
    return null;
  }

  const point = projectToWorldMap(lat, lng);
  if (!point) {
    return null;
  }

  let nearestCode: string | null = null;
  let nearestDistance = COASTAL_TOLERANCE;

  for (const shape of WORLD_COUNTRY_SHAPES) {
    const bounds = BOUNDS_BY_CODE.get(shape.code);
    if (!bounds) {
      continue;
    }

    const outsideBounds =
      point.x < bounds.minX - COASTAL_TOLERANCE ||
      point.x > bounds.maxX + COASTAL_TOLERANCE ||
      point.y < bounds.minY - COASTAL_TOLERANCE ||
      point.y > bounds.maxY + COASTAL_TOLERANCE;

    if (outsideBounds) {
      continue;
    }

    for (const ring of shape.rings) {
      if (isInsideRing(ring, point.x, point.y)) {
        return shape.code;
      }

      const distance = distanceToRing(ring, point.x, point.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestCode = shape.code;
      }
    }
  }

  return nearestCode;
}

/** 国コードから日本語の国名を返す。分からなければコードをそのまま返す */
export function getCountryName(code: string | null | undefined): string {
  if (!code) {
    return '国不明';
  }

  return SHAPE_BY_CODE.get(code)?.name ?? code;
}

export function getCountryShape(code: string): CountryShape | null {
  return SHAPE_BY_CODE.get(code) ?? null;
}

/** 写真の座標から、訪れた国コードの一覧を作る（重複なし） */
export function collectVisitedCountryCodes(
  points: { lat: number | null; lng: number | null }[]
): string[] {
  const codes = new Set<string>();

  for (const point of points) {
    const code = findCountryCode(point.lat, point.lng);
    if (code) {
      codes.add(code);
    }
  }

  return Array.from(codes);
}

export const WORLD_COUNTRY_COUNT = WORLD_COUNTRY_SHAPES.length;
