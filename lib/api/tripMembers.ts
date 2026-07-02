import type { Database } from '@/types/db';
import type { TripMember } from '@/types/app';

type TripMemberRow = Database['public']['Tables']['trip_members']['Row'];

export function mapTripMemberRow(row: TripMemberRow): TripMember {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at
  };
}
