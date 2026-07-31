'use client';

import { useMemo } from 'react';
import { clsx } from 'clsx';
import {
  WORLD_COUNTRY_SHAPES,
  WORLD_MAP_HEIGHT,
  WORLD_MAP_WIDTH,
  projectToWorldMap
} from '@/constants/worldMapShapes';

export type WorldMapMarker = {
  id: string;
  lat: number;
  lng: number;
};

type WorldMapProps = {
  /** 色を塗る国（ISO 3166-1 alpha-2） */
  highlightedCountryCodes?: string[];
  markers?: WorldMapMarker[];
  showRoute?: boolean;
  selectedMarkerId?: string | null;
  onSelectMarker?: (markerId: string) => void;
  onSelectCountry?: (countryCode: string) => void;
  /** ピンのある範囲へ寄せて表示する。世界全体を見せたいときは false */
  fitToMarkers?: boolean;
  className?: string;
};

/** 輪郭データ（[x0,y0,x1,y1,...]の配列）をSVGのpath文字列にする */
function ringsToPath(rings: number[][]): string {
  let path = '';

  for (const ring of rings) {
    if (ring.length < 6) {
      continue;
    }
    path += `M${ring[0]} ${ring[1]}`;
    for (let index = 2; index < ring.length; index += 2) {
      path += `L${ring[index]} ${ring[index + 1]}`;
    }
    path += 'Z';
  }

  return path;
}

/** ピンが1か所に固まっていても地図として読めるように、最低限これだけの幅は映す */
const MIN_VIEW_WIDTH = 90;
const VIEW_MARGIN = 24;

export function WorldMap({
  className,
  fitToMarkers = false,
  highlightedCountryCodes = [],
  markers = [],
  onSelectCountry,
  onSelectMarker,
  selectedMarkerId,
  showRoute = false
}: WorldMapProps) {
  const highlighted = useMemo(() => new Set(highlightedCountryCodes), [highlightedCountryCodes]);

  const points = useMemo(
    () =>
      markers
        .map((marker) => {
          const position = projectToWorldMap(marker.lat, marker.lng);
          return position ? { marker, ...position } : null;
        })
        .filter((point): point is { marker: WorldMapMarker; x: number; y: number } => point !== null),
    [markers]
  );

  // ピンのある範囲に寄せる。寄せない場合は世界全体。
  const view = useMemo(() => {
    if (!fitToMarkers || points.length === 0) {
      return { x: 0, y: 0, width: WORLD_MAP_WIDTH, height: WORLD_MAP_HEIGHT };
    }

    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

    const spanX = Math.max(...xs) - Math.min(...xs) + VIEW_MARGIN * 2;
    const spanY = Math.max(...ys) - Math.min(...ys) + VIEW_MARGIN * 2;

    // 縦横比は世界地図と同じに保つ（形がゆがまないように）
    const aspect = WORLD_MAP_WIDTH / WORLD_MAP_HEIGHT;
    let width = Math.max(spanX, spanY * aspect, MIN_VIEW_WIDTH);
    let height = width / aspect;

    if (width > WORLD_MAP_WIDTH) {
      width = WORLD_MAP_WIDTH;
      height = WORLD_MAP_HEIGHT;
    }

    const x = Math.min(Math.max(centerX - width / 2, 0), WORLD_MAP_WIDTH - width);
    const y = Math.min(Math.max(centerY - height / 2, 0), WORLD_MAP_HEIGHT - height);

    return { x, y, width, height };
  }, [fitToMarkers, points]);

  // 拡大しても、ピンや線が画面上で同じ太さに見えるようにする
  const unit = view.width / WORLD_MAP_WIDTH;

  return (
    <svg
      className={clsx('h-auto w-full', className)}
      role="img"
      aria-label="世界地図"
      viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
    >
      {WORLD_COUNTRY_SHAPES.map((country) => {
        const isHighlighted = highlighted.has(country.code);
        const clickable = Boolean(onSelectCountry) && isHighlighted;

        return (
          <path
            className={clsx(
              'stroke-white transition-colors',
              isHighlighted ? 'fill-enadia-primary' : 'fill-slate-200',
              clickable && 'cursor-pointer hover:fill-enadia-primaryDark'
            )}
            d={ringsToPath(country.rings)}
            key={country.code}
            onClick={clickable && onSelectCountry ? () => onSelectCountry(country.code) : undefined}
            strokeWidth={0.4 * unit}
          >
            <title>{country.name}</title>
          </path>
        );
      })}

      {showRoute && points.length >= 2 ? (
        <polyline
          className="fill-none stroke-enadia-primary"
          points={points.map((point) => `${point.x},${point.y}`).join(' ')}
          strokeDasharray={`${4 * unit} ${3 * unit}`}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2 * unit}
        />
      ) : null}

      {points.map((point, index) => {
        const isSelected = point.marker.id === selectedMarkerId;

        return (
          <g
            className={onSelectMarker ? 'cursor-pointer' : undefined}
            key={point.marker.id}
            onClick={onSelectMarker ? () => onSelectMarker(point.marker.id) : undefined}
          >
            <circle
              className={clsx('stroke-white', isSelected ? 'fill-enadia-accent' : 'fill-enadia-primary')}
              cx={point.x}
              cy={point.y}
              r={(isSelected ? 9 : 7) * unit}
              strokeWidth={2 * unit}
            />
            <text
              className="pointer-events-none select-none fill-white font-bold"
              dominantBaseline="central"
              fontSize={8 * unit}
              textAnchor="middle"
              x={point.x}
              y={point.y}
            >
              {index + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
