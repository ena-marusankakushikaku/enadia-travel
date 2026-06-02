'use client';

import { useMemo, useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import type { Photo } from '@/types/app';

type TravelMapProps = {
  photos: Photo[];
  onAddThemeFromPhoto?: (photo: Photo) => void;
};

type GeoPhoto = Photo & { lat: number; lng: number };

function normalize(value: number, min: number, max: number): number {
  if (min === max) {
    return 50;
  }

  return 12 + ((value - min) / (max - min)) * 76;
}

export function TravelMap({ onAddThemeFromPhoto, photos }: TravelMapProps) {
  const geoPhotos = useMemo(
    () =>
      photos
        .filter((photo): photo is GeoPhoto => photo.lat !== null && photo.lng !== null)
        .sort((a, b) => new Date(a.capturedAt ?? a.ts).getTime() - new Date(b.capturedAt ?? b.ts).getTime()),
    [photos]
  );
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(geoPhotos[0]?.id ?? null);
  const selectedPhoto = geoPhotos.find((photo) => photo.id === selectedPhotoId) ?? geoPhotos[0];

  if (geoPhotos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-enadia-line bg-white p-5 text-center text-sm text-enadia-muted">
        位置情報のある写真がまだありません。
      </div>
    );
  }

  const lats = geoPhotos.map((photo) => photo.lat);
  const lngs = geoPhotos.map((photo) => photo.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const points = geoPhotos.map((photo) => ({
    photo,
    left: normalize(photo.lng, minLng, maxLng),
    top: 88 - normalize(photo.lat, minLat, maxLat)
  }));

  return (
    <section className="rounded-lg border border-enadia-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-enadia-primary" aria-hidden="true" />
        <h2 className="text-base font-bold text-enadia-ink">Travel Map</h2>
      </div>
      <div className="relative h-56 overflow-hidden rounded-lg bg-[linear-gradient(135deg,#dff4f0_0%,#edf7ff_48%,#f7f2df_100%)]">
        <svg className="absolute inset-0 h-full w-full" role="img" aria-label="旅の位置情報マップ" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            fill="none"
            points={points.map((point) => `${point.left},${point.top}`).join(' ')}
            stroke="#0f8b8d"
            strokeDasharray="2 2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
        {points.map((point, index) => (
          <button
            className="absolute -translate-x-1/2 -translate-y-1/2"
            key={point.photo.id}
            onClick={() => setSelectedPhotoId(point.photo.id)}
            style={{ left: `${point.left}%`, top: `${point.top}%` }}
            type="button"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-enadia-primary text-sm font-bold text-white shadow-lg ring-4 ring-white">
              {index + 1}
            </span>
          </button>
        ))}
      </div>
      {selectedPhoto ? (
        <div className="mt-3 rounded-lg bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-enadia-ink">{selectedPhoto.placeName ?? '地点未設定'}</p>
              <p className="mt-1 text-xs text-enadia-muted">
                confidence {selectedPhoto.confidence ? Math.round(selectedPhoto.confidence * 100) : 0}%
              </p>
            </div>
            {onAddThemeFromPhoto ? (
              <button
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-enadia-primary"
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
