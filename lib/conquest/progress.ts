import type { ConquestEntry, Photo } from '@/types/app';

export const PREFECTURE_TOTAL = 47;

export type EntryLocation = { lat: number | null; lng: number | null };

/**
 * テーマ記録の座標を集める。
 *
 * 記録そのものに座標が入っていればそれを使い、無ければ紐づく写真の座標で補う。
 * 海外の記録は都道府県を持たないので、国の判定にはこの座標を使う。
 */
export function collectEntryLocations(entries: ConquestEntry[], photos: Photo[]): EntryLocation[] {
  const photoById = new Map(photos.map((photo) => [photo.id, photo]));

  return entries.map((entry) => {
    if (entry.lat !== null && entry.lat !== undefined && entry.lng !== null && entry.lng !== undefined) {
      return { lat: entry.lat, lng: entry.lng };
    }

    const photo = entry.photoId ? photoById.get(entry.photoId) : undefined;
    return { lat: photo?.lat ?? null, lng: photo?.lng ?? null };
  });
}

/** 記録がある都道府県の数（海外の記録は数えない） */
export function countAchievedPrefectures(entries: ConquestEntry[]): number {
  return new Set(
    entries.map((entry) => entry.prefectureId).filter((id): id is number => id !== null)
  ).size;
}

/** 47都道府県のうち何%か */
export function prefectureProgress(entries: ConquestEntry[]): number {
  return Math.round((countAchievedPrefectures(entries) / PREFECTURE_TOTAL) * 100);
}
