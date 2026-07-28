'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { MAP_PREFECTURES } from '@/constants/japan';
import { RatingInput } from '@/components/conquest/RatingInput';
import { persistThemeEntry } from '@/lib/api/themeEntriesClient';
import type { Photo } from '@/types/app';

type AddConquestEntryModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  projectId: string;
  userId: string;
  photos: Photo[];
};

/** 日本時間での今日の日付を YYYY-MM-DD で返す */
function todayInJapan(): string {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function AddConquestEntryModal({
  onClose,
  onSaved,
  open,
  photos,
  projectId,
  userId
}: AddConquestEntryModalProps) {
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [prefectureId, setPrefectureId] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [photoId, setPhotoId] = useState('');
  const [visitedAt, setVisitedAt] = useState(todayInJapan);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPhoto = photos.find((photo) => photo.id === photoId);
  const canSave = title.trim().length > 0 && prefectureId.length > 0;

  // 写真を選んだら、その写真の位置情報で都道府県・地点名・日付を埋める
  useEffect(() => {
    if (!selectedPhoto) {
      return;
    }

    if (selectedPhoto.prefectureId !== null) {
      setPrefectureId(String(selectedPhoto.prefectureId));
    }
    if (selectedPhoto.placeName) {
      setPlaceName(selectedPhoto.placeName);
    }
    const capturedAt = selectedPhoto.capturedAt ?? selectedPhoto.ts;
    if (capturedAt) {
      const parsed = new Date(capturedAt);
      if (!Number.isNaN(parsed.getTime())) {
        setVisitedAt(new Date(parsed.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10));
      }
    }
  }, [selectedPhoto]);

  async function save() {
    if (!canSave || saving) {
      return;
    }

    setSaving(true);
    setError(null);

    // 日付だけの入力なので、日本時間の0時として保存する
    const visitedAtIso = new Date(`${visitedAt}T00:00:00+09:00`).toISOString();

    const persisted = await persistThemeEntry({
      id: `draft-${projectId}`,
      projectId,
      userId,
      tripId: selectedPhoto?.tripId ?? null,
      photoId: photoId || null,
      prefectureId: Number(prefectureId),
      title: title.trim(),
      memo: memo.trim() || null,
      rating,
      visitedAt: visitedAtIso,
      placeName: placeName.trim() || selectedPhoto?.placeName || null,
      lat: selectedPhoto?.lat ?? null,
      lng: selectedPhoto?.lng ?? null,
      source: photoId ? 'photo_suggestion' : 'manual',
      metadata: {}
    });

    setSaving(false);

    if (!persisted) {
      setError('保存に失敗しました。時間をおいて試してください。');
      return;
    }

    setTitle('');
    setMemo('');
    setPlaceName('');
    setPhotoId('');
    onSaved();
    onClose();
  }

  return (
    <Modal onClose={onClose} open={open} testId="add-conquest-entry-modal" title="制覇記録を追加">
      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">店名・商品名</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-enadia-line px-3 text-sm"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例：獺祭、道後温泉"
            value={title}
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">写真から選ぶ（任意）</span>
          <select
            className="mt-2 h-11 w-full rounded-lg border border-enadia-line bg-white px-3 text-sm"
            onChange={(event) => setPhotoId(event.target.value)}
            value={photoId}
          >
            <option value="">写真なし</option>
            {photos.map((photo) => (
              <option key={photo.id} value={photo.id}>
                {photo.placeName ?? '地点未設定'}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-enadia-muted">
            選ぶと、その写真の場所と日付が自動で入ります。
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">都道府県</span>
          <select
            className="mt-2 h-11 w-full rounded-lg border border-enadia-line bg-white px-3 text-sm"
            onChange={(event) => setPrefectureId(event.target.value)}
            value={prefectureId}
          >
            <option value="">選択してください</option>
            {MAP_PREFECTURES.map((prefecture) => (
              <option key={prefecture.id} value={prefecture.id}>
                {prefecture.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">地点名（任意）</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-enadia-line px-3 text-sm"
            onChange={(event) => setPlaceName(event.target.value)}
            placeholder="例：金沢市 広坂一丁目"
            value={placeName}
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">訪問日</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-enadia-line px-3 text-sm"
            onChange={(event) => setVisitedAt(event.target.value)}
            type="date"
            value={visitedAt}
          />
        </label>

        <RatingInput onChange={setRating} value={rating} />

        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">メモ（任意）</span>
          <textarea
            className="mt-2 min-h-20 w-full rounded-lg border border-enadia-line p-3 text-sm"
            onChange={(event) => setMemo(event.target.value)}
            placeholder="味の感想や、また行きたい理由など"
            value={memo}
          />
        </label>

        {error ? <p className="text-sm text-enadia-danger">{error}</p> : null}

        <div className="flex gap-2 pt-1">
          <Button className="flex-1" onClick={onClose} variant="secondary">
            キャンセル
          </Button>
          <Button
            className="flex-1"
            disabled={!canSave}
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            loading={saving}
            onClick={save}
          >
            追加
          </Button>
        </div>
      </div>
    </Modal>
  );
}
