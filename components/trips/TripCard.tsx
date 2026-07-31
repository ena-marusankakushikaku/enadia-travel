'use client';

import Link from 'next/link';
import { Trash2, UsersRound, Image as ImageIcon, ChevronRight } from 'lucide-react';
import type { Trip, TripMember } from '@/types/app';
import { formatDateRange } from '@/lib/format';
import { MockPhoto } from '@/components/photos/MockPhoto';

type TripCardProps = {
  trip: Trip;
  /** この旅の写真の枚数 */
  photoCount: number;
  /** 表紙に出す1枚の画像URL。写真が無ければ null */
  coverImageUrl: string | null;
  members: TripMember[];
  onDelete?: (tripId: string) => void;
};

// 一覧では写真の中身は使わないので、枚数と表紙1枚だけを受け取る。
// 以前はこの旅の写真をすべて受け取っており、写真が増えるほど表示が重くなっていた。
export function TripCard({ coverImageUrl, members, onDelete, photoCount, trip }: TripCardProps) {

  return (
    <article className="overflow-hidden rounded-lg border border-enadia-line bg-white shadow-sm transition hover:border-enadia-primary">
      <div className="flex items-center gap-3 p-3">
        <Link className="shrink-0" href={`/trips/${trip.id}`}>
          <MockPhoto
            className="h-16 w-16 rounded-lg"
            index={0}
            src={coverImageUrl}
            title={null}
          />
        </Link>

        <Link className="min-w-0 flex-1" href={`/trips/${trip.id}`}>
          <h2 className="truncate text-sm font-bold text-enadia-ink">{trip.title}</h2>
          <p className="mt-0.5 truncate text-xs text-enadia-muted">
            {formatDateRange(trip.startsAt, trip.endsAt)}
            {trip.area ? ` ・ ${trip.area}` : ''}
          </p>
          <div className="mt-1.5 flex items-center gap-3 text-[11px] font-semibold text-enadia-muted">
            <span className="inline-flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {photoCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
              {members.length}
            </span>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          {onDelete ? (
            <button
              aria-label={`${trip.title}を削除`}
              className="grid h-8 w-8 place-items-center rounded-full text-enadia-muted transition hover:bg-red-50 hover:text-enadia-danger"
              onClick={() => onDelete(trip.id)}
              type="button"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
          <Link
            aria-label={`${trip.title}の詳細へ`}
            className="grid h-8 w-8 place-items-center rounded-full text-enadia-muted transition hover:bg-slate-100"
            href={`/trips/${trip.id}`}
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
