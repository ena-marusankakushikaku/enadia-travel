'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import {
  dateForTripDay,
  getTripDayCount,
  selectionFromDate,
  type TripDaySelection
} from '@/lib/trips/tripDay';
import type { Photo } from '@/types/app';

type PhotoDateModalProps = {
  photo: Photo | null;
  tripStartsAt: string;
  tripEndsAt: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toDateInput(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return new Date(parsed.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

function formatPreview(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }).format(parsed);
}

export function PhotoDateModal({
  onClose,
  onSaved,
  open,
  photo,
  tripEndsAt,
  tripStartsAt
}: PhotoDateModalProps) {
  const [selection, setSelection] = useState<TripDaySelection | null>(null);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayCount = getTripDayCount(tripStartsAt, tripEndsAt);

  // 別の写真を開いたときに、その写真の現在値でフォームを初期化する
  useEffect(() => {
    if (!photo) {
      return;
    }

    const current = photo.capturedAt ?? photo.ts;
    setSelection(selectionFromDate(current, tripStartsAt, tripEndsAt));
    setCustomDate(toDateInput(current));
    setUseCustomDate(false);
    setError(null);
  }, [photo, tripEndsAt, tripStartsAt]);

  const resolvedIso = useCustomDate
    ? customDate
      ? new Date(`${customDate}T12:00:00+09:00`).toISOString()
      : null
    : selection
      ? dateForTripDay(tripStartsAt, tripEndsAt, selection)
      : null;

  async function save() {
    if (!photo || saving) {
      return;
    }

    if (!resolvedIso) {
      setError('日付を選んでください。');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/photo-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id, capturedAt: resolvedIso })
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? '保存に失敗しました。');
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError('通信に失敗しました。時間をおいて試してください。');
    } finally {
      setSaving(false);
    }
  }

  const options: { key: string; label: string; value: TripDaySelection }[] = [
    { key: 'before', label: '旅行前', value: { kind: 'before' } },
    ...Array.from({ length: dayCount }, (_, index) => ({
      key: `day-${index + 1}`,
      label: `${index + 1}日目`,
      value: { kind: 'day' as const, day: index + 1 }
    })),
    { key: 'after', label: '旅行後', value: { kind: 'after' } }
  ];

  function isSelected(option: TripDaySelection): boolean {
    if (useCustomDate || !selection) {
      return false;
    }
    if (option.kind === 'day' && selection.kind === 'day') {
      return option.day === selection.day;
    }
    return option.kind === selection.kind;
  }

  const hasExif = photo?.capturedAt !== null && photo?.capturedAt !== undefined;

  return (
    <Modal onClose={onClose} open={open} testId="photo-date-modal" title="撮影日を設定">
      <div className="space-y-4">
        <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-enadia-muted">
          {hasExif
            ? '写真に記録された撮影日を使っています。違っていればここで直せます。'
            : 'この写真には撮影日が残っていないため、アップロードした日時で表示しています。旅の何日目かを選ぶと正しい日付になります。'}
        </p>

        <div>
          <span className="text-sm font-bold text-enadia-ink">旅のいつの写真ですか？</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {options.map((option) => (
              <button
                className={clsx(
                  'rounded-full border px-3 py-1.5 text-xs font-bold transition',
                  isSelected(option.value)
                    ? 'border-enadia-primary bg-enadia-primary text-white'
                    : 'border-enadia-line bg-white text-enadia-muted hover:bg-slate-50'
                )}
                key={option.key}
                onClick={() => {
                  setSelection(option.value);
                  setUseCustomDate(false);
                  setError(null);
                }}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <button
            className={clsx(
              'text-xs font-bold underline underline-offset-2',
              useCustomDate ? 'text-enadia-primary' : 'text-enadia-muted'
            )}
            onClick={() => {
              setUseCustomDate((current) => !current);
              setError(null);
            }}
            type="button"
          >
            {useCustomDate ? '「何日目か」で選ぶ' : '日付を直接指定する'}
          </button>

          {useCustomDate ? (
            <input
              className="mt-2 h-11 w-full rounded-lg border border-enadia-line px-3 text-sm"
              onChange={(event) => setCustomDate(event.target.value)}
              type="date"
              value={customDate}
            />
          ) : null}
        </div>

        <p className="flex items-center gap-2 rounded-lg border border-enadia-line px-3 py-2.5 text-sm">
          <CalendarDays className="h-4 w-4 shrink-0 text-enadia-muted" aria-hidden="true" />
          <span className="text-enadia-muted">保存される日付</span>
          <span className="ml-auto font-bold text-enadia-ink">{formatPreview(resolvedIso)}</span>
        </p>

        {error ? <p className="text-sm text-enadia-danger">{error}</p> : null}

        <div className="flex gap-2">
          <Button className="flex-1" onClick={onClose} variant="secondary">
            キャンセル
          </Button>
          <Button
            className="flex-1"
            icon={<Check className="h-4 w-4" aria-hidden="true" />}
            loading={saving}
            onClick={save}
          >
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}
