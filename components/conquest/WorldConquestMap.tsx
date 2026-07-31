'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// 世界地図のデータは大きいので、世界地図を開いたときに初めて読み込む
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

type WorldConquestMapProps = {
  /** 色を塗る国を決めるための座標。写真やテーマ記録の緯度経度 */
  locations: { lat: number | null; lng: number | null }[];
  caption?: string;
};

export function WorldConquestMap({ caption, locations }: WorldConquestMapProps) {
  const [visitedCountryCodes, setVisitedCountryCodes] = useState<string[]>([]);

  // 「海外」なので日本は数に入れない。地図上では塗ったままにして、行った場所が分かるようにする
  const overseasCount = visitedCountryCodes.filter((code) => code !== 'JP').length;

  return (
    <section className="rounded-lg border border-enadia-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-enadia-ink">海外 制覇マップ</h2>
        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-enadia-primary">
          {overseasCount} か国
        </span>
      </div>

      <div className="mt-3">
        <WorldMapView
          excludeFromList={['JP']}
          locations={locations}
          onVisitedCountries={setVisitedCountryCodes}
          showCountryList
        />
      </div>

      <p className="mt-2 text-xs text-enadia-muted">
        {caption ?? '位置情報のある写真から、訪れた国を色分けしています。'}
        {visitedCountryCodes.includes('JP')
          ? ' 日本も地図には塗っていますが、か国数には数えていません（日本国内の実績は「日本」で見られます）。'
          : ''}
      </p>
    </section>
  );
}
