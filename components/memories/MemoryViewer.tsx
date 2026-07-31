'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Pause, Play, RotateCcw, X } from 'lucide-react';
import { clsx } from 'clsx';
import { getPrefectureName } from '@/constants/japan';
import type { Photo } from '@/types/app';

/** 1枚あたりの表示時間（ミリ秒）。CSSのアニメーション時間と揃える */
const SLIDE_DURATION_MS = 5000;

type MemoryViewerProps = {
  photos: Photo[];
  startIndex: number;
  open: boolean;
  /** 開いた直後から自動再生するか */
  autoPlay: boolean;
  title: string;
  /** 旅ID → 旅の名前。キャプションに出す */
  tripTitles?: Record<string, string>;
  onClose: () => void;
};

function formatDate(photo: Photo): string {
  const parsed = new Date(photo.capturedAt ?? photo.ts);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }).format(parsed);
}

export function MemoryViewer({
  autoPlay,
  onClose,
  open,
  photos,
  startIndex,
  title,
  tripTitles = {}
}: MemoryViewerProps) {
  const [index, setIndex] = useState(startIndex);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isFinished, setIsFinished] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // 開くたびに最初の状態へ戻す
  useEffect(() => {
    if (open) {
      setIndex(startIndex);
      setIsPlaying(autoPlay);
      setIsFinished(false);
    }
  }, [autoPlay, open, startIndex]);

  const goNext = useCallback(() => {
    setIndex((current) => {
      if (current >= photos.length - 1) {
        setIsPlaying(false);
        setIsFinished(true);
        return current;
      }
      return current + 1;
    });
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setIsFinished(false);
    setIndex((current) => Math.max(0, current - 1));
  }, []);

  // 自動再生
  useEffect(() => {
    if (!open || !isPlaying || photos.length === 0) {
      return;
    }

    const timer = window.setTimeout(goNext, SLIDE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [goNext, index, isPlaying, open, photos.length]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft') {
        setIsPlaying(false);
        goPrev();
      } else if (event.key === 'ArrowRight') {
        setIsPlaying(false);
        goNext();
      } else if (event.key === ' ') {
        event.preventDefault();
        setIsPlaying((current) => !current);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [goNext, goPrev, onClose, open]);

  if (!open || photos.length === 0) {
    return null;
  }

  const photo = photos[Math.min(index, photos.length - 1)];
  const tripTitle = tripTitles[photo.tripId];

  function restart() {
    setIndex(0);
    setIsFinished(false);
    setIsPlaying(true);
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-40 mx-auto flex max-w-[480px] flex-col bg-black text-white"
      role="dialog"
      style={{ ['--slide-duration' as string]: `${SLIDE_DURATION_MS}ms` }}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX ?? null;
        touchStartX.current = null;
        if (start === null || end === null) {
          return;
        }
        const distance = end - start;
        if (Math.abs(distance) < 60) {
          return;
        }
        setIsPlaying(false);
        if (distance > 0) {
          goPrev();
        } else {
          goNext();
        }
      }}
    >
      {/* 進行状況を示すバー */}
      <div className="flex gap-1 px-3 pt-[max(10px,env(safe-area-inset-top))]">
        {photos.map((item, itemIndex) => (
          <span className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25" key={item.id}>
            <span
              className={clsx(
                'block h-full bg-white',
                itemIndex < index && 'w-full',
                itemIndex === index && (isPlaying ? 'animate-slide-progress w-full' : 'w-full opacity-60'),
                itemIndex > index && 'w-0'
              )}
            />
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between px-3 py-2">
        <button
          aria-label="閉じる"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 px-2 text-center">
          <p className="truncate text-xs font-bold text-white/90">{title}</p>
          <p className="text-[11px] text-white/50">
            {index + 1} / {photos.length}
          </p>
        </div>
        <button
          aria-label={isPlaying ? '一時停止' : '再生'}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
          onClick={() => {
            if (isFinished) {
              restart();
              return;
            }
            setIsPlaying((current) => !current);
          }}
          type="button"
        >
          {isFinished ? (
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Play className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {photo.imageUrl ? (
          // keyを写真ごとに変えることで、切り替わるたびに演出をやり直す
          <img
            alt={photo.placeName ?? ''}
            className="animate-kenburns absolute inset-0 h-full w-full object-cover"
            key={photo.id}
            src={photo.imageUrl}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-slate-900 text-sm text-white/50">
            画像を読み込めませんでした
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 pb-5 pt-16">
          <div className="animate-slide-fade" key={`caption-${photo.id}`}>
            <p className="flex items-center gap-1.5 text-base font-bold">
              <MapPin className="h-4 w-4 shrink-0 text-white/70" aria-hidden="true" />
              <span className="truncate">{photo.placeName ?? getPrefectureName(photo.prefectureId)}</span>
            </p>
            <p className="mt-1 text-xs text-white/70">
              {formatDate(photo)}
              {tripTitle ? ` ・ ${tripTitle}` : ''}
            </p>
            {photo.caption ? <p className="mt-2 text-sm text-white/85">{photo.caption}</p> : null}
          </div>
        </div>

        {index > 0 ? (
          <button
            aria-label="前の写真"
            className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 backdrop-blur transition hover:bg-black/55"
            onClick={() => {
              setIsPlaying(false);
              goPrev();
            }}
            type="button"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
        ) : null}

        {index < photos.length - 1 ? (
          <button
            aria-label="次の写真"
            className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 backdrop-blur transition hover:bg-black/55"
            onClick={() => {
              setIsPlaying(false);
              goNext();
            }}
            type="button"
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {isFinished ? (
        <div className="safe-bottom flex items-center justify-center gap-3 border-t border-white/10 px-4 py-3">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2.5 text-sm font-bold transition hover:bg-white/20"
            onClick={restart}
            type="button"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            もう一度見る
          </button>
          <button
            className="rounded-full bg-enadia-primary px-4 py-2.5 text-sm font-bold transition hover:bg-enadia-primaryDark"
            onClick={onClose}
            type="button"
          >
            閉じる
          </button>
        </div>
      ) : null}
    </div>
  );
}
