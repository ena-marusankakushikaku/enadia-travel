import type { TripMember, TripRole } from '@/types/app';

export const roleRank: Record<TripRole, number> = {
  viewer: 0,
  editor: 1,
  owner: 2
};

export function getTripRole(
  tripId: string,
  userId: string,
  members: TripMember[]
): TripRole | null {
  return members.find((member) => member.tripId === tripId && member.userId === userId)?.role ?? null;
}

export function canEditTrip(role: TripRole | null): boolean {
  return role !== null && roleRank[role] >= roleRank.editor;
}

export function canManageTrip(role: TripRole | null): boolean {
  return role === 'owner';
}
