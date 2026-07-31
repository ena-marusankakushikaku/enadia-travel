'use client';

import { useMemo, useState } from 'react';
import { TripCard } from '@/components/trips/TripCard';
import type { Trip, TripMember } from '@/types/app';

export type TripListItem = {
  trip: Trip;
  members: TripMember[];
  /** この旅の写真の枚数 */
  photoCount: number;
  /** 表紙に出す1枚の画像URL */
  coverImageUrl: string | null;
};

type TripListClientProps = {
  items: TripListItem[];
};

/** 日付が取れないときのグループ用（年不明として一番下にまとめる） */
const UNKNOWN_YEAR = 0;

function getYear(trip: Trip): number {
  const parsed = new Date(trip.startsAt);
  return Number.isNaN(parsed.getTime()) ? UNKNOWN_YEAR : parsed.getFullYear();
}

export function TripListClient({ items }: TripListClientProps) {
  const [hiddenTripIds, setHiddenTripIds] = useState<string[]>([]);

  const visibleItems = useMemo(
    () => items.filter((item) => !hiddenTripIds.includes(item.trip.id)),
    [items, hiddenTripIds]
  );

  // 年ごとにまとめ、新しい年・新しい旅から順に並べる
  const groups = useMemo(() => {
    const byYear = new Map<number, TripListItem[]>();

    for (const item of visibleItems) {
      const year = getYear(item.trip);
      const group = byYear.get(year);
      if (group) {
        group.push(item);
      } else {
        byYear.set(year, [item]);
      }
    }

    return Array.from(byYear.entries())
      .map(([year, groupItems]) => ({
        year,
        items: [...groupItems].sort(
          (a, b) => new Date(b.trip.startsAt).getTime() - new Date(a.trip.startsAt).getTime()
        )
      }))
      .sort((a, b) => b.year - a.year);
  }, [visibleItems]);

  if (visibleItems.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-enadia-line bg-white p-6 text-center text-sm text-enadia-muted">
        旅がまだありません。「新しい旅を作成」から始めましょう。
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs font-semibold text-enadia-muted">全 {visibleItems.length} 件の旅</p>

      {groups.map((group) => (
        <section key={group.year}>
          <div className="mb-2 flex items-center gap-3">
            <h2 className="text-base font-bold text-enadia-ink">
              {group.year === UNKNOWN_YEAR ? '日付未設定' : `${group.year}年`}
            </h2>
            <span className="text-xs font-semibold text-enadia-muted">{group.items.length}件</span>
            <span className="h-px flex-1 bg-enadia-line" />
          </div>

          <div className="space-y-2">
            {group.items.map(({ coverImageUrl, members, photoCount, trip }) => (
              <TripCard
                coverImageUrl={coverImageUrl}
                key={trip.id}
                members={members}
                onDelete={(tripId) => setHiddenTripIds((ids) => [...ids, tripId])}
                photoCount={photoCount}
                trip={trip}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
