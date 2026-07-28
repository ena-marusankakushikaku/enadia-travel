'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { MAP_PREFECTURES } from '@/constants/japan';
import type { Photo } from '@/types/app';

type PhotoLocationModalProps = {
  photo: Photo | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function PhotoLocationModal({ onClose, onSaved, open, photo }: PhotoLocationModalProps) {
  const [prefectureId, setPrefectureId] = useState<number | ''>('');
  const [placeName, setPlaceName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 別の写真を開いたときに、その写真の現在値でフォームを初期化する
  useEffect(() => {
    setPrefectureId(photo?.prefectureId ?? '');
    setPlaceName(photo?.placeName ?? '');
    setError(null);
  }, [photo]);

  async function save() {
    if (!photo || prefectureId === '') {
      setError('都道府県を選択してください。');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/photo-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id, prefectureId, placeName })
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
    <Modal onClose={onClose} open={open} testId="photo-location-modal" title="場所を設定">
      <div className="space-y-4">
        <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-enadia-muted">
          写真に位置情報が無い場合は、ここで都道府県と地点名を設定できます。設定すると旅ログの地図と制覇マップに反映されます。
        </p>

        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">都道府県</span>
          <select
            className="mt-2 h-11 w-full rounded-lg border border-enadia-line bg-white px-3 text-sm"
            onChange={(event) => setPrefectureId(event.target.value === '' ? '' : Number(event.target.value))}
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
            placeholder="例：清水寺、横浜駅西口"
            value={placeName}
          />
          <span className="mt-1 block text-xs text-enadia-muted">
            空欄の場合は都道府県名が地点名になります。
          </span>
        </label>

        {error ? <p className="text-sm text-enadia-danger">{error}</p> : null}

        <div className="flex gap-2">
          <Button className="flex-1" onClick={onClose} variant="secondary">
            キャンセル
          </Button>
          <Button
            className="flex-1"
            icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
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
