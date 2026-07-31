'use client';

import { useEffect, useMemo } from 'react';
import { WorldMap, type WorldMapMarker } from '@/components/map/WorldMap';
import { PinchZoom } from '@/components/map/PinchZoom';
import { collectVisitedCountryCodes, getCountryName } from '@/constants/world';

type WorldMapViewProps = {
  /** 国の色分けに使う座標。写真の緯度経度をそのまま渡す */
  locations: { lat: number | null; lng: number | null }[];
  markers?: WorldMapMarker[];
  showRoute?: boolean;
  fitToMarkers?: boolean;
  selectedMarkerId?: string | null;
  onSelectMarker?: (markerId: string) => void;
  onSelectCountry?: (countryCode: string) => void;
  /** 判定した国コードを親に知らせる。ヘッダーの「N か国」表示に使う */
  onVisitedCountries?: (codes: string[]) => void;
  /** 地図の下に国名を並べる */
  showCountryList?: boolean;
  /** 国名の一覧から外す国コード。地図の色分けからは外さない */
  excludeFromList?: string[];
};

/**
 * 世界地図の表示部分。
 *
 * 世界地図のデータ（約140KB）はこのファイル経由でしか読み込まれない。
 * 呼び出し側が next/dynamic で読み込むことで、海外の写真が無い人には
 * ダウンロードされないようにしている。
 */
export function WorldMapView({
  excludeFromList = [],
  fitToMarkers = false,
  locations,
  markers = [],
  onSelectCountry,
  onSelectMarker,
  onVisitedCountries,
  selectedMarkerId,
  showCountryList = false,
  showRoute = false
}: WorldMapViewProps) {
  const visitedCodes = useMemo(() => collectVisitedCountryCodes(locations), [locations]);

  useEffect(() => {
    onVisitedCountries?.(visitedCodes);
  }, [onVisitedCountries, visitedCodes]);

  const listedCodes = visitedCodes.filter((code) => !excludeFromList.includes(code));

  return (
    <>
      <PinchZoom>
        <WorldMap
          fitToMarkers={fitToMarkers}
          highlightedCountryCodes={visitedCodes}
          markers={markers}
          onSelectCountry={onSelectCountry}
          onSelectMarker={onSelectMarker}
          selectedMarkerId={selectedMarkerId}
          showRoute={showRoute}
        />
      </PinchZoom>

      {showCountryList && listedCodes.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {listedCodes.map((code) => (
            <span
              className="rounded-full bg-teal-50 px-2 py-1 text-[11px] font-bold text-enadia-primary"
              key={code}
            >
              {getCountryName(code)}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}
