'use client';

import { useMemo, useState } from 'react';
import { CalendarHeart, Film, Play, Star } from 'lucide-react';
import { MockPhoto } from '@/components/photos/MockPhoto';
import { MemoryViewer } from '@/components/memories/MemoryViewer';
import { TasteInsights } from '@/components/memories/TasteInsights';
import { buildTripDigest } from '@/lib/memories/buildDigest';
import type { MemorySet } from '@/lib/memories/selectMemories';
import type { ConquestEntry, ConquestProject, Photo, Trip } from '@/types/app';

type TravelLogClientProps = {
  memorySet: MemorySet | null;
  photos: Photo[];
  trips: Trip[];
  projects: ConquestProject[];
  entries: ConquestEntry[];
  currentUserId: string;
};

type ViewerState = {
  photos: Photo[];
  startIndex: number;
  autoPlay: boolean;
  title: string;
};

export function TravelLogClient({
  currentUserId,
  entries,
  memorySet,
  photos,
  projects,
  trips
}: TravelLogClientProps) {
  const [viewer, setViewer] = useState<ViewerState | null>(null);

  const tripTitles = useMemo(
    () => Object.fromEntries(trips.map((trip) => [trip.id, trip.title])),
    [trips]
  );

  const favorites = useMemo(
    () =>
      photos
        .filter((photo) =>
          photo.reactions.some(
            (reaction) => reaction.reactionType === 'heart' && reaction.userId === currentUserId
          )
        )
        .sort((a, b) => new Date(b.capturedAt ?? b.ts).getTime() - new Date(a.capturedAt ?? a.ts).getTime()),
    [currentUserId, photos]
  );

  const tripsWithPhotos = useMemo(
    () =>
      trips
        .map((trip) => ({ trip, tripPhotos: photos.filter((photo) => photo.tripId === trip.id) }))
        .filter((item) => item.tripPhotos.length > 0),
    [photos, trips]
  );

  return (
    <div className="space-y-6">
      {/* あの頃の今日 */}
      <section>
        <h2 className="flex items-center gap-2 text-base font-bold text-enadia-ink">
          <CalendarHeart className="h-4 w-4 text-enadia-primary" aria-hidden="true" />
          {memorySet?.title ?? 'あの頃の今日'}
        </h2>

        {memorySet ? (
          <div className="mt-2 overflow-hidden rounded-lg border border-enadia-line bg-white shadow-sm">
            <button
              className="relative block aspect-[16/10] w-full"
              onClick={() =>
                setViewer({ photos: memorySet.photos, startIndex: 0, autoPlay: true, title: memorySet.title })
              }
              type="button"
            >
              <MockPhoto
                className="h-full w-full"
                index={memorySet.photos[0]?.mockImageIndex}
                src={memorySet.photos[0]?.imageUrl}
                title={null}
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-left">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-white">{memorySet.subtitle}</span>
                  <span className="block text-xs text-white/75">{memorySet.photos.length}枚のおもいで</span>
                </span>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/95 text-enadia-primary shadow-lg">
                  <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
                </span>
              </span>
            </button>

            {memorySet.photos.length > 1 ? (
              <div className="flex gap-1 overflow-x-auto p-2">
                {memorySet.photos.map((photo, index) => (
                  <button
                    className="h-14 w-14 shrink-0 overflow-hidden rounded-md"
                    key={photo.id}
                    onClick={() =>
                      setViewer({
                        photos: memorySet.photos,
                        startIndex: index,
                        autoPlay: false,
                        title: memorySet.title
                      })
                    }
                    type="button"
                  >
                    <MockPhoto
                      className="h-full w-full"
                      index={photo.mockImageIndex}
                      src={photo.imageUrl}
                      title={null}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 rounded-lg border border-dashed border-enadia-line bg-white p-5 text-center text-sm leading-relaxed text-enadia-muted">
            まだ振り返れる写真がありません。写真が増えると、過去の同じ日の思い出がここに出てきます。
          </p>
        )}
      </section>

      {/* 旅のスライドショー */}
      <section>
        <h2 className="flex items-center gap-2 text-base font-bold text-enadia-ink">
          <Film className="h-4 w-4 text-enadia-primary" aria-hidden="true" />
          旅をスライドショーで見る
        </h2>

        {tripsWithPhotos.length > 0 ? (
          <div className="mt-2 space-y-2">
            {tripsWithPhotos.map(({ trip, tripPhotos }) => (
              <button
                className="flex w-full items-center gap-3 rounded-lg border border-enadia-line bg-white p-3 text-left transition hover:border-enadia-primary"
                key={trip.id}
                onClick={() =>
                  setViewer({
                    photos: buildTripDigest(tripPhotos, currentUserId, 10),
                    startIndex: 0,
                    autoPlay: true,
                    title: trip.title
                  })
                }
                type="button"
              >
                <MockPhoto
                  className="h-14 w-14 shrink-0 rounded-lg"
                  index={tripPhotos[0]?.mockImageIndex}
                  src={tripPhotos[0]?.imageUrl}
                  title={null}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-enadia-ink">{trip.title}</span>
                  <span className="block text-xs text-enadia-muted">{tripPhotos.length}枚から見どころを再生</span>
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-50 text-enadia-primary">
                  <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 rounded-lg border border-dashed border-enadia-line bg-white p-5 text-center text-sm text-enadia-muted">
            写真のある旅がまだありません。
          </p>
        )}
      </section>

      {/* お気に入り */}
      <section>
        <h2 className="flex items-center gap-2 text-base font-bold text-enadia-ink">
          <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
          お気に入り
          {favorites.length > 0 ? (
            <span className="text-xs font-semibold text-enadia-muted">{favorites.length}枚</span>
          ) : null}
        </h2>

        {favorites.length > 0 ? (
          <div className="mt-2 grid grid-cols-3 gap-1">
            {favorites.map((photo, index) => (
              <button
                className="relative aspect-square overflow-hidden rounded-md"
                key={photo.id}
                onClick={() =>
                  setViewer({ photos: favorites, startIndex: index, autoPlay: false, title: 'お気に入り' })
                }
                type="button"
              >
                <MockPhoto
                  className="h-full w-full"
                  index={photo.mockImageIndex}
                  src={photo.imageUrl}
                  title={null}
                />
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 rounded-lg border border-dashed border-enadia-line bg-white p-5 text-center text-sm leading-relaxed text-enadia-muted">
            写真を開いて「お気に入り」を付けると、旅をまたいでここに集まります。自分だけに見えるしおりです。
          </p>
        )}
      </section>

      <TasteInsights entries={entries} projects={projects} />

      <MemoryViewer
        autoPlay={viewer?.autoPlay ?? false}
        onClose={() => setViewer(null)}
        open={viewer !== null}
        photos={viewer?.photos ?? []}
        startIndex={viewer?.startIndex ?? 0}
        title={viewer?.title ?? ''}
        tripTitles={tripTitles}
      />
    </div>
  );
}
