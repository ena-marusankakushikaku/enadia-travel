import type { Database } from '@/types/db';
import type { TripInvite } from '@/types/app';

type TripInviteRow = Database['public']['Tables']['trip_invites']['Row'];

export function mapTripInviteRow(row: TripInviteRow): TripInvite {
  return {
    id: row.id,
    tripId: row.trip_id,
    token: row.token,
    createdBy: row.created_by,
    role: row.role,
    isActive: row.is_active,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  };
}
