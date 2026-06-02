'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Gift, Flame, Plus, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/common/AppShell';
import { TripCard } from '@/components/trips/TripCard';
import {
  mockCurrentUserId,
  mockPhotos,
  mockTripMembers,
  mockTrips,
  mockUsers,
  mockUserStats
} from '@/constants/mockData';
import { getTripRole } from '@/lib/permissions';

export default function TripsPage() {
  const [hiddenTripIds, setHiddenTripIds] = useState<string[]>([]);

  const currentUser = mockUsers.find((user) => user.id === mockCurrentUserId);
  const currentStats = mockUserStats.find((stats) => stats.userId === mockCurrentUserId);
  const visibleTrips = useMemo(
    () =>
      mockTrips.filter(
        (trip) =>
          !hiddenTripIds.includes(trip.id) &&
          getTripRole(trip.id, mockCurrentUserId, mockTripMembers)
      ),
    [hiddenTripIds]
  );

  return (
    <AppShell subtitle="旅管理MVP" title="旅一覧">
      <section className="mb-5 overflow-hidden rounded-lg bg-enadia-ink text-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_20%_0%,rgba(15,139,141,0.55),transparent_32%),linear-gradient(135deg,#18212f,#243449)] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/68">ENADIA Travel</p>
          <h1 className="mt-2 text-2xl font-bold">写真から旅の価値を育てる</h1>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[11px] text-white/62">Plan</p>
              <p className="mt-1 text-sm font-bold uppercase">{currentUser?.plan ?? 'free'}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[11px] text-white/62">Points</p>
              <p className="mt-1 text-sm font-bold">{(currentStats?.points ?? 0).toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[11px] text-white/62">Streak</p>
              <p className="mt-1 text-sm font-bold">{currentStats?.loginStreakDays ?? 0} days</p>
            </div>
          </div>
          <Link
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-enadia-primary px-4 text-sm font-semibold text-white transition hover:bg-enadia-primaryDark"
            href="/trips/new"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            新しい旅を作成
          </Link>
        </div>
      </section>

      {currentUser?.plan === 'free' ? (
        <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-bold">
            <Gift className="h-4 w-4" aria-hidden="true" />
            Freeプラン広告枠
          </div>
          <p className="mt-2">Proにすると広告非表示、AI整理、共有容量アップが使えます。</p>
        </section>
      ) : null}

      <section className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-enadia-line bg-white p-4">
          <Sparkles className="h-5 w-5 text-enadia-primary" aria-hidden="true" />
          <p className="mt-3 text-2xl font-bold text-enadia-ink">{visibleTrips.length}</p>
          <p className="text-xs font-semibold text-enadia-muted">Active trips</p>
        </div>
        <div className="rounded-lg border border-enadia-line bg-white p-4">
          <Flame className="h-5 w-5 text-enadia-accent" aria-hidden="true" />
          <p className="mt-3 text-2xl font-bold text-enadia-ink">{currentStats?.loginStreakDays ?? 0}</p>
          <p className="text-xs font-semibold text-enadia-muted">Login streak</p>
        </div>
      </section>

      <section className="space-y-4">
        {visibleTrips.map((trip) => (
          <TripCard
            key={trip.id}
            members={mockTripMembers.filter((member) => member.tripId === trip.id)}
            onDelete={(tripId) => setHiddenTripIds((ids) => [...ids, tripId])}
            photos={mockPhotos.filter((photo) => photo.tripId === trip.id)}
            trip={trip}
            users={mockUsers}
          />
        ))}
      </section>
    </AppShell>
  );
}
