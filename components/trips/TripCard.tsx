'use client';

import Link from 'next/link';
import { Trash2, UsersRound, Image as ImageIcon } from 'lucide-react';
import type { Photo, Trip, TripMember, UserProfile } from '@/types/app';
import { formatDateRange } from '@/lib/format';
import { MockPhoto } from '@/components/photos/MockPhoto';

type TripCardProps = {
  trip: Trip;
  photos: Photo[];
  members: TripMember[];
  users: UserProfile[];
  onDelete?: (tripId: string) => void;
};

export function TripCard({ members, onDelete, photos, trip, users }: TripCardProps) {
  const coverPhoto = photos.find((photo) => photo.id === trip.coverPhotoId) ?? photos[0];
  const memberUsers = members
    .map((member) => users.find((user) => user.id === member.userId))
    .filter((user): user is UserProfile => Boolean(user));

  return (
    <article className="overflow-hidden rounded-lg border border-enadia-line bg-white shadow-sm">
      <Link className="block" href={`/trips/${trip.id}`}>
        <MockPhoto className="aspect-[16/9] w-full" index={coverPhoto?.mockImageIndex ?? 0} title={trip.area} />
      </Link>
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <Link className="min-w-0" href={`/trips/${trip.id}`}>
            <h2 className="truncate text-lg font-bold text-enadia-ink">{trip.title}</h2>
            <p className="mt-1 text-sm text-enadia-muted">{formatDateRange(trip.startsAt, trip.endsAt)}</p>
          </Link>
          {onDelete ? (
            <button
              aria-label={`${trip.title}を削除`}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-50 text-enadia-danger transition hover:bg-red-100"
              onClick={() => onDelete(trip.id)}
              type="button"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-enadia-muted">
          <span className="inline-flex items-center gap-1.5">
            <ImageIcon className="h-4 w-4" aria-hidden="true" />
            {photos.length} photos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UsersRound className="h-4 w-4" aria-hidden="true" />
            {members.length} members
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-enadia-line pt-3">
          <div className="flex -space-x-2">
            {memberUsers.slice(0, 4).map((user) => (
              <div
                className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-enadia-primary text-xs font-bold text-white"
                key={user.id}
                title={user.displayName}
              >
                {user.displayName.slice(0, 1)}
              </div>
            ))}
          </div>
          <Link className="text-sm font-bold text-enadia-primary" href={`/trips/${trip.id}`}>
            詳細へ
          </Link>
        </div>
      </div>
    </article>
  );
}
