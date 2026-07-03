import type { Database } from '@/types/db';
import type { ConquestEntry } from '@/types/app';

type ConquestEntryRow = Database['public']['Tables']['conquest_entries']['Row'];

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
    rating: row.rating,
    visitedAt: row.visited_at,
    placeName: row.place_name,
    lat: row.lat,
    lng: row.lng,
    source: row.source,
    metadata: (row.metadata as Record<string, unknown> | null) ?? {}
  };
}
