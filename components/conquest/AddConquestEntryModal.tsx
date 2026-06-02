'use client';

import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { MAP_PREFECTURES } from '@/constants/japan';
import type { ConquestEntry, Photo } from '@/types/app';

type AddConquestEntryModalProps = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  userId: string;
  photos: Photo[];
  onAdd: (entry: ConquestEntry) => void;
};

export function AddConquestEntryModal({ onAdd, onClose, open, photos, projectId, userId }: AddConquestEntryModalProps) {
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [rating, setRating] = useState('4');
  const [prefectureId, setPrefectureId] = useState('26');
  const [placeName, setPlaceName] = useState('');
  const [photoId, setPhotoId] = useState('');
  const [visitedAt, setVisitedAt] = useState('2026-05-11');
  const [source, setSource] = useState<ConquestEntry['source']>('manual');
  const canSave = title.trim().length > 0 && prefectureId.length > 0;

  function add() {
    if (!canSave) {
      return;
    }
    const photo = photos.find((item) => item.id === photoId);
    onAdd({
      id: `entry-${Date.now()}`,
      projectId,
      userId,
      tripId: photo?.tripId ?? null,
      photoId: photoId || null,
      prefectureId: Number(prefectureId),
      title: title.trim(),
      memo: memo.trim() || null,
      rating: Number(rating),
      visitedAt: new Date(visitedAt).toISOString(),
      placeName: placeName.trim() || photo?.placeName || null,
      lat: photo?.lat ?? null,
      lng: photo?.lng ?? null,
      source,
      metadata: { createdFrom: 'conquest_detail_modal' }
    });
    onClose();
  }

  return (
    <Modal onClose={onClose} open={open} testId="add-conquest-entry-modal" title="制覇記録を追加">
      <div className="space-y-3">
        <input className="h-11 w-full rounded-lg border border-enadia-line px-3" placeholder="タイトル" value={title} onChange={(event) => setTitle(event.target.value)} />
        <textarea className="min-h-20 w-full rounded-lg border border-enadia-line p-3" placeholder="メモ" value={memo} onChange={(event) => setMemo(event.target.value)} />
        <select className="h-11 w-full rounded-lg border border-enadia-line bg-white px-3" value={rating} onChange={(event) => setRating(event.target.value)}>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              評価 {value}
            </option>
          ))}
        </select>
        <select className="h-11 w-full rounded-lg border border-enadia-line bg-white px-3" value={prefectureId} onChange={(event) => setPrefectureId(event.target.value)}>
          {MAP_PREFECTURES.map((prefecture) => (
            <option key={prefecture.id} value={prefecture.id}>
              {prefecture.name}
            </option>
          ))}
        </select>
        <input className="h-11 w-full rounded-lg border border-enadia-line px-3" placeholder="地点名" value={placeName} onChange={(event) => setPlaceName(event.target.value)} />
        <input className="h-11 w-full rounded-lg border border-enadia-line px-3" type="date" value={visitedAt} onChange={(event) => setVisitedAt(event.target.value)} />
        <select className="h-11 w-full rounded-lg border border-enadia-line bg-white px-3" value={source} onChange={(event) => setSource(event.target.value as ConquestEntry['source'])}>
          <option value="manual">manual</option>
          <option value="photo_suggestion">photo_suggestion</option>
          <option value="ai_auto">ai_auto</option>
        </select>
        <select className="h-11 w-full rounded-lg border border-enadia-line bg-white px-3" value={photoId} onChange={(event) => setPhotoId(event.target.value)}>
          <option value="">写真なし</option>
          {photos.map((photo) => (
            <option key={photo.id} value={photo.id}>
              {photo.placeName ?? photo.id}
            </option>
          ))}
        </select>
        <Button className="w-full" disabled={!canSave} onClick={add}>
          追加
        </Button>
      </div>
    </Modal>
  );
}
