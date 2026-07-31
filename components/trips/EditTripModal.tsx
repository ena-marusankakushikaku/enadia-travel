'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, Check, MapPin } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { describeTripRangeChange, getTripDayCount } from '@/lib/trips/tripDay';
import type { Photo, Trip } from '@/types/app';

type EditTripModalProps = {
  trip: Trip;
  /** 期間を縮めたときに、旅の外へ出る写真が何枚あるか数えるのに使う */
  photos: Photo[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** ISO文字列を input[type=date] が受け取れる YYYY-MM-DD（日本時間）にする */
function toDateInput(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return new Date(parsed.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

/** 確認文を組み立てる。前と後ろの両方が出る場合は1文にまとめる */
function buildMoveMessage(toBefore: number, toAfter: number): string | null {
  if (toBefore > 0 && toAfter > 0) {
    return `すでに登録されている写真のうち、${toBefore}枚が「旅行前」に、${toAfter}枚が「旅行後」に振り分けられます。よろしいですか？`;
  }

  if (toBefore > 0) {
    return `すでに登録されている写真 ${toBefore}枚が「旅行前」に振り分けられます。よろしいですか？`;
  }

  if (toAfter > 0) {
    return `すでに登録されている写真 ${toAfter}枚が「旅行後」に振り分けられます。よろしいですか？`;
  }

  return null;
}

export function EditTripModal({ onClose, onSaved, open, photos, trip }: EditTripModalProps) {
  const [title, setTitle] = useState(trip.title);
  const [area, setArea] = useState(trip.area);
  const [startsAt, setStartsAt] = useState(toDateInput(trip.startsAt));
  const [endsAt, setEndsAt] = useState(toDateInput(trip.endsAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  // モーダルを開き直したときに、いま保存されている値へ戻す
  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(trip.title);
    setArea(trip.area);
    setStartsAt(toDateInput(trip.startsAt));
    setEndsAt(toDateInput(trip.endsAt));
    setError(null);
    setConfirmMessage(null);
  }, [open, trip]);

  const currentDayCount = getTripDayCount(trip.startsAt, trip.endsAt);
  const nextDayCount = startsAt && endsAt ? getTripDayCount(startsAt, endsAt) : 0;
  const dayCountChanged = nextDayCount > 0 && nextDayCount !== currentDayCount;

  /** 保存前の確認。旅の外に押し出される写真があれば、いったん止めて確認する */
  function requestSave() {
    if (!title.trim()) {
      setError('旅名を入力してください。');
      return;
    }

    if (startsAt && endsAt && startsAt > endsAt) {
      setError('終了日は開始日より後にしてください。');
      return;
    }

    if (startsAt && endsAt) {
      const { toAfter, toBefore } = describeTripRangeChange(
        photos.map((photo) => photo.capturedAt ?? photo.ts),
        { startsAt: trip.startsAt, endsAt: trip.endsAt },
        { startsAt, endsAt }
      );

      const message = buildMoveMessage(toBefore, toAfter);
      if (message) {
        setError(null);
        setConfirmMessage(message);
        return;
      }
    }

    void save();
  }

  async function save() {
    if (saving) {
      return;
    }

    setConfirmMessage(null);
    setError(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          area: area.trim() || null,
          startsAt: startsAt || null,
          endsAt: endsAt || null
        })
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

  return (
    <Modal onClose={onClose} open={open} testId="edit-trip-modal" title="旅の情報を編集">
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">旅名</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-enadia-line bg-white px-3 text-sm"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="初夏の瀬戸内リサーチ旅"
            value={title}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-bold text-enadia-ink">開始日</span>
            <div className="mt-2 flex items-center rounded-lg border border-enadia-line bg-white px-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-enadia-muted" aria-hidden="true" />
              <input
                className="h-11 min-w-0 flex-1 px-1.5 text-sm outline-none"
                onChange={(event) => setStartsAt(event.target.value)}
                type="date"
                value={startsAt}
              />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-enadia-ink">終了日</span>
            <div className="mt-2 flex items-center rounded-lg border border-enadia-line bg-white px-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-enadia-muted" aria-hidden="true" />
              <input
                className="h-11 min-w-0 flex-1 px-1.5 text-sm outline-none"
                min={startsAt || undefined}
                onChange={(event) => setEndsAt(event.target.value)}
                type="date"
                value={endsAt}
              />
            </div>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">エリア</span>
          <div className="mt-2 flex items-center rounded-lg border border-enadia-line bg-white px-2">
            <MapPin className="h-4 w-4 shrink-0 text-enadia-muted" aria-hidden="true" />
            <input
              className="h-11 min-w-0 flex-1 px-1.5 text-sm outline-none"
              onChange={(event) => setArea(event.target.value)}
              placeholder="広島・尾道"
              value={area}
            />
          </div>
        </label>

        <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-enadia-muted">
          写真の「◯日目」は開始日から計算しています。期間を変えると写真の見出しも自動で付け直されます。
          {dayCountChanged ? (
            <span className="mt-1 block font-bold text-enadia-ink">
              {currentDayCount}日間 → {nextDayCount}日間 になります。
            </span>
          ) : null}
        </p>

        {error ? <p className="text-sm text-enadia-danger">{error}</p> : null}

        {confirmMessage ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="flex items-start gap-2 text-sm leading-relaxed text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{confirmMessage}</span>
            </p>
            <p className="mt-1.5 pl-6 text-xs text-amber-800">
              写真そのものは消えません。「旅行前」「旅行後」の括りに移るだけで、あとから写真ごとに撮影日を直せます。
            </p>
            <div className="mt-3 flex gap-2">
              <Button className="flex-1" onClick={() => setConfirmMessage(null)} variant="secondary">
                いいえ
              </Button>
              <Button className="flex-1" loading={saving} onClick={save}>
                はい
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button className="flex-1" onClick={onClose} variant="secondary">
              キャンセル
            </Button>
            <Button
              className="flex-1"
              icon={<Check className="h-4 w-4" aria-hidden="true" />}
              loading={saving}
              onClick={requestSave}
            >
              保存
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
