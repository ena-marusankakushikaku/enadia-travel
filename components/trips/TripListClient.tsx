'use client';

import { useMemo, useState } from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { TripCard } from '@/components/trips/TripCard';
import type { Photo, Trip, TripMember, UserProfile } from '@/types/app';

export type TripListItem = {
  trip: Trip;
  members: TripMember[];
  photos: Photo[];
};

type TripListClientProps = {
  items: TripListItem[];
  users: UserProfile[];
  loginStreakDays: number;
};

export function TripListClient({ items, loginStreakDays, users }: TripListClientProps) {
  const [hiddenTripIds, setHiddenTripIds] = useState<string[]>([]);
  const visibleItems = useMemo(
    () => items.filter((item) => !hiddenTripIds.includes(item.trip.id)),
    [items, hiddenTripIds]
  );

  return (
    <>
      <section className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-enadia-line bg-white p-4">
          <Sparkles className="h-5 w-5 text-enadia-primary" aria-hidden="true" />
          <p className="mt-3 text-2xl font-bold text-enadia-ink">{visibleItems.length}</p>
          <p className="text-xs font-semibold text-enadia-muted">Active trips</p>
        </div>
        <div className="rounded-lg border border-enadia-line bg-white p-4">
          <Flame className="h-5 w-5 text-enadia-accent" aria-hidden="true" />
          <p className="mt-3 text-2xl font-bold text-enadia-ink">{loginStreakDays}</p>
          <p className="text-xs font-semibold text-enadia-muted">Login streak</p>
        </div>
      </section>

      <section className="space-y-4">
        {visibleItems.map(({ trip, members, photos }) => (
          <TripCard
            key={trip.id}
            members={members}
            onDelete={(tripId) => setHiddenTripIds((ids) => [...ids, tripId])}
            photos={photos}
            trip={trip}
            users={users}
          />
        ))}
      </section>
    </>
  );
}
