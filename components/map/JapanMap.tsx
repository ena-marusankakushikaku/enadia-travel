'use client';

import { useMemo } from 'react';
import { clsx } from 'clsx';
import {
  JAPAN_MAP_HEIGHT,
  JAPAN_MAP_INSET_BOX,
  JAPAN_MAP_WIDTH,
  JAPAN_PREFECTURE_SHAPES,
  projectToJapanMap
} from '@/constants/japanMapShapes';

export type JapanMapMarker = {
  id: string;
  lat: number;
  lng: number;
};

type JapanMapProps = {
  /** 色を塗る都道府県 */
  highlightedPrefectureIds?: number[];
  /** 地図上に置くピン。渡した順に番号が振られる */
  markers?: JapanMapMarker[];
  /** ピンを順番に線でつなぐ */
  showRoute?: boolean;
  selectedMarkerId?: string | null;
  onSelectMarker?: (markerId: string) => void;
  onSelectPrefecture?: (prefectureId: number) => void;
  className?: string;
};

export function JapanMap({
  className,
  highlightedPrefectureIds = [],
  markers = [],
  onSelectMarker,
  onSelectPrefecture,
  selectedMarkerId,
  showRoute = false
}: JapanMapProps) {
  const highlighted = useMemo(() => new Set(highlightedPrefectureIds), [highlightedPrefectureIds]);

  // 日本の範囲外にある座標は地図に置けないので除外する
  const points = useMemo(
    () =>
      markers
        .map((marker) => {
          const position = projectToJapanMap(marker.lat, marker.lng);
          return position ? { marker, ...position } : null;
        })
        .filter((point): point is { marker: JapanMapMarker; x: number; y: number } => point !== null),
    [markers]
  );

  return (
    <svg
      className={clsx('h-auto w-full', className)}
      role="img"
      aria-label="日本地図"
      viewBox={`0 0 ${JAPAN_MAP_WIDTH} ${JAPAN_MAP_HEIGHT}`}
    >
      {/* 沖縄・奄美をまとめて表示している枠 */}
      <rect
        className="fill-none stroke-enadia-line"
        height={JAPAN_MAP_INSET_BOX.height}
        rx="6"
        strokeWidth="1"
        width={JAPAN_MAP_INSET_BOX.width}
        x={JAPAN_MAP_INSET_BOX.x}
        y={JAPAN_MAP_INSET_BOX.y}
      />

      {JAPAN_PREFECTURE_SHAPES.map((prefecture) => {
        const isHighlighted = highlighted.has(prefecture.id);
        const clickable = Boolean(onSelectPrefecture);

        return (
          <path
            className={clsx(
              'stroke-white transition-colors',
              isHighlighted ? 'fill-enadia-primary' : 'fill-slate-200',
              clickable && 'cursor-pointer hover:fill-enadia-primaryDark'
            )}
            d={prefecture.d}
            key={prefecture.id}
            onClick={onSelectPrefecture ? () => onSelectPrefecture(prefecture.id) : undefined}
            strokeWidth="0.6"
          >
            <title>{prefecture.name}</title>
          </path>
        );
      })}

      {showRoute && points.length >= 2 ? (
        <polyline
          className="fill-none stroke-enadia-primary"
          points={points.map((point) => `${point.x},${point.y}`).join(' ')}
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
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
              r={isSelected ? 9 : 7}
              strokeWidth="2"
            />
            <text
              className="pointer-events-none select-none fill-white font-bold"
              dominantBaseline="central"
              fontSize="8"
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
