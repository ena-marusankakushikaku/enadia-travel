'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { clsx } from 'clsx';
import { Globe2, MapPin } from 'lucide-react';
import { PinchZoom } from '@/components/map/PinchZoom';
import { isWithinJapanBounds } from '@/lib/geo/prefectureCoordinates';
import type { Photo } from '@/types/app';

// 日本地図のデータも50KBほどある。地図は画面の下のほうにあり、
// 開いた直後には見えないので、必要になってから読み込む
const JapanMap = dynamic(() => import('@/components/map/JapanMap').then((module) => module.JapanMap), {
  ssr: false,
  loading: () => (
    <div className="grid h-40 place-items-center rounded-lg bg-slate-50 text-xs text-enadia-muted">
      地図を読み込んでいます…
    </div>
  )
});

// 世界地図のデータは大きいので、切り替えたときに初めて読み込む
const WorldMapView = dynamic(
  () => import('@/components/map/WorldMapView').then((module) => module.WorldMapView),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-40 place-items-center rounded-lg bg-slate-50 text-xs text-enadia-muted">
        世界地図を読み込んでいます…
      </div>
    )
  }
);

type TravelMapProps = {
  photos: Photo[];
  /** ピンをタップしたときに開く写真。写真タブのグリッドと同じビューアを使う */
  onOpenPhoto?: (photoId: string) => void;
};

type GeoPhoto = Photo & { lat: number; lng: number };
type MapMode = 'japan' | 'world';

export function TravelMap({ onOpenPhoto, photos }: TravelMapProps) {
  const geoPhotos = useMemo(
    () =>
      photos
        .filter((photo): photo is GeoPhoto => photo.lat !== null && photo.lng !== null)
        .sort((a, b) => new Date(a.capturedAt ?? a.ts).getTime() - new Date(b.capturedAt ?? b.ts).getTime()),
    [photos]
  );

  // 日本の外で撮った写真があるかどうか。地図の初期表示を決めるのに使う
  const hasOverseasPhoto = useMemo(
    () => geoPhotos.some((photo) => !isWithinJapanBounds(photo.lat, photo.lng)),
    [geoPhotos]
  );

  const [mode, setMode] = useState<MapMode | null>(null);
  const activeMode: MapMode = mode ?? (hasOverseasPhoto ? 'world' : 'japan');

  const [visitedCountryCodes, setVisitedCountryCodes] = useState<string[]>([]);

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

  // 「日本」の対になる言葉としては「世界」より「海外」のほうが自然
  const modeButtons: { id: MapMode; label: string }[] = [
    { id: 'japan', label: '日本' },
    { id: 'world', label: '海外' }
  ];

  return (
    <section className="rounded-lg border border-enadia-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {activeMode === 'world' ? (
          <Globe2 className="h-4 w-4 text-enadia-primary" aria-hidden="true" />
        ) : (
          <MapPin className="h-4 w-4 text-enadia-primary" aria-hidden="true" />
        )}
        <h2 className="text-base font-bold text-enadia-ink">Travel Map</h2>

        <div className="ml-auto flex rounded-full border border-enadia-line p-0.5">
          {modeButtons.map((button) => (
            <button
              className={clsx(
                'rounded-full px-3 py-1 text-xs font-bold transition',
                activeMode === button.id ? 'bg-enadia-ink text-white' : 'text-enadia-muted hover:bg-slate-50'
              )}
              key={button.id}
              onClick={() => setMode(button.id)}
              type="button"
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-2 text-xs font-semibold text-enadia-muted">
        {geoPhotos.length}地点
        {activeMode === 'japan'
          ? ` / ${visitedPrefectureIds.length}都道府県`
          : visitedCountryCodes.length > 0
            ? ` / ${visitedCountryCodes.length}か国`
            : ''}
      </p>

      {activeMode === 'japan' ? (
        <PinchZoom>
          <JapanMap
            highlightedPrefectureIds={visitedPrefectureIds}
            markers={markers}
            onSelectMarker={onOpenPhoto}
            showRoute
          />
        </PinchZoom>
      ) : (
        <WorldMapView
          fitToMarkers
          locations={geoPhotos}
          markers={markers}
          onSelectMarker={onOpenPhoto}
          onVisitedCountries={setVisitedCountryCodes}
          showCountryList
          showRoute
        />
      )}

      {onOpenPhoto ? (
        <p className="mt-2 text-xs text-enadia-muted">番号のついた地点をタップすると、その写真を開けます。</p>
      ) : null}

      {activeMode === 'japan' && hasOverseasPhoto ? (
        <p className="mt-2 text-xs text-enadia-muted">
          日本の外で撮った写真は日本地図に表示できません。「海外」に切り替えると見られます。
        </p>
      ) : null}
    </section>
  );
}
