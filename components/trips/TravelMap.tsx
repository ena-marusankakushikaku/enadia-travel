'use client';

import { useMemo, useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { JapanMap } from '@/components/map/JapanMap';
import { getPrefectureName } from '@/constants/japan';
import type { Photo } from '@/types/app';

type TravelMapProps = {
  photos: Photo[];
  onAddThemeFromPhoto?: (photo: Photo) => void;
};

type GeoPhoto = Photo & { lat: number; lng: number };

export function TravelMap({ onAddThemeFromPhoto, photos }: TravelMapProps) {
  const geoPhotos = useMemo(
    () =>
      photos
        .filter((photo): photo is GeoPhoto => photo.lat !== null && photo.lng !== null)
        .sort((a, b) => new Date(a.capturedAt ?? a.ts).getTime() - new Date(b.capturedAt ?? b.ts).getTime()),
    [photos]
  );

  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const selectedPhoto = geoPhotos.find((photo) => photo.id === selectedPhotoId) ?? geoPhotos[0];

  const markers = useMemo(
    () => geoPhotos.map((photo) => ({ id: photo.id, lat: photo.lat, lng: photo.lng })),
    [geoPhotos]
  );

  const visitedPrefectureIds = useMemo(
    () =>
      Array.from(
        new Set(geoPhotos.map((photo) => photo.prefectureId).filter((id): id is number => id !== null))
      ),
    [geoPhotos]
  );

  if (geoPhotos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-enadia-line bg-white p-5 text-center text-sm text-enadia-muted">
        位置情報のある写真がまだありません。
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-enadia-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-enadia-primary" aria-hidden="true" />
        <h2 className="text-base font-bold text-enadia-ink">Travel Map</h2>
        <span className="ml-auto text-xs font-semibold text-enadia-muted">
          {geoPhotos.length}地点 / {visitedPrefectureIds.length}都道府県
        </span>
      </div>

      <div className="overflow-hidden rounded-lg bg-[linear-gradient(160deg,#eef7fb_0%,#f6fbfd_100%)] p-2">
        <JapanMap
          highlightedPrefectureIds={visitedPrefectureIds}
          markers={markers}
          onSelectMarker={setSelectedPhotoId}
          selectedMarkerId={selectedPhoto?.id ?? null}
          showRoute
        />
      </div>

      {selectedPhoto ? (
        <div className="mt-3 rounded-lg bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-bold text-enadia-ink">{selectedPhoto.placeName ?? '地点未設定'}</p>
              <p className="mt-1 text-xs text-enadia-muted">
                {getPrefectureName(selectedPhoto.prefectureId)}
                {selectedPhoto.confidence !== null
                  ? ` ・ 位置の確度 ${Math.round(selectedPhoto.confidence * 100)}%`
                  : ''}
              </p>
            </div>
            {onAddThemeFromPhoto ? (
              <button
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-enadia-primary"
                onClick={() => onAddThemeFromPhoto(selectedPhoto)}
                type="button"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                テーマへ
              </button>
            ) : null}
          </div>
          {selectedPhoto.suggestedThemes?.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedPhoto.suggestedThemes.map((theme) => (
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-enadia-muted" key={theme.theme}>
                  {theme.label} {theme.confidence}%
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
