import type { Database } from '@/types/db';
import type { ConquestEntry } from '@/types/app';

type ConquestEntryRow = Database['public']['Tables']['conquest_entries']['Row'];

// 評価は小数で保存しているため、文字列で返ってきても数値として扱えるようにする
function toRating(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapConquestEntryRow(row: ConquestEntryRow): ConquestEntry {
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    tripId: row.trip_id,
    photoId: row.photo_id,
    prefectureId: row.prefecture_id,
    title: row.title,
    memo: row.memo,
    rating: toRating(row.rating),
    visitedAt: row.visited_at,
    placeName: row.place_name,
    lat: row.lat,
    lng: row.lng,
    source: row.source,
    metadata: (row.metadata as Record<string, unknown> | null) ?? {}
  };
}
