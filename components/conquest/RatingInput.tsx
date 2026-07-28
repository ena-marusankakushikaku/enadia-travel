'use client';

import { Star } from 'lucide-react';
import { clsx } from 'clsx';

type RatingInputProps = {
  /** null は「評価なし」 */
  value: number | null;
  onChange: (value: number | null) => void;
  label?: string;
};

const DEFAULT_RATING = 3;

export function formatRating(value: number | null | undefined): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  return `★${value.toFixed(1)}`;
}

export function RatingInput({ label = '評価', onChange, value }: RatingInputProps) {
  const isRated = value !== null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-enadia-ink">{label}</span>
        <span
          className={clsx(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
            isRated ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-enadia-muted'
          )}
        >
          {isRated ? (
            <>
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
              {value.toFixed(1)}
            </>
          ) : (
            '評価なし'
          )}
        </span>
      </div>

      <div className="mt-2 flex gap-2">
        <button
          className={clsx(
            'shrink-0 rounded-lg border px-3 py-2 text-xs font-bold transition',
            isRated
              ? 'border-enadia-line bg-white text-enadia-muted hover:bg-slate-50'
              : 'border-enadia-primary bg-enadia-primary text-white'
          )}
          onClick={() => onChange(isRated ? null : DEFAULT_RATING)}
          type="button"
        >
          {isRated ? '評価をやめる' : '評価なし'}
        </button>

        <div className="min-w-0 flex-1">
          <input
            aria-label={`${label}（0.0から5.0）`}
            className="h-11 w-full accent-amber-500 disabled:opacity-40"
            disabled={!isRated}
            max={5}
            min={0}
            onChange={(event) => onChange(Number(event.target.value))}
            step={0.1}
            type="range"
            value={value ?? DEFAULT_RATING}
          />
          <div className="flex justify-between text-[10px] font-semibold text-enadia-muted">
            <span>0.0</span>
            <span>2.5</span>
            <span>5.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
