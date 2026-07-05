import type { Database } from '@/types/db';
import type { Plan, UserProfile } from '@/types/app';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type PublicProfileRow = Database['public']['Views']['public_profiles']['Row'];

export function mapProfileRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    plan: row.plan as Plan,
    homePrefectureId: null
  };
}

// public_profiles intentionally omits plan/points (private); co-members only need the name/avatar.
// The view's columns are typed as nullable by Postgres/PostgREST metadata, but id and
// display_name are NOT NULL on the underlying profiles table.
export function mapPublicProfileRow(row: PublicProfileRow & { id: string }): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name ?? 'Traveler',
    avatarUrl: row.avatar_url,
    plan: 'free',
    homePrefectureId: null
  };
}
