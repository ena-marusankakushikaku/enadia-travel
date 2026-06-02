import type { Database } from '@/types/db';
import type { Trip } from '@/types/app';

type TripRow = Database['public']['Tables']['trips']['Row'];

export function mapTripRow(row: TripRow, memberIds: string[] = []): Trip {
  return {
    id: row.id,
    title: row.title,
    area: row.area ?? '',
    startsAt: row.starts_at ?? row.created_at,
    endsAt: row.ends_at ?? row.starts_at ?? row.created_at,
    ownerId: row.owner_id,
    coverPhotoId: null,
    memberIds,
    description: row.description
  };
}
