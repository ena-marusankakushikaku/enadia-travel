'use client';

import { useMemo, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { DEFAULT_CONQUEST_THEMES } from '@/constants/themes';
import { MAP_PREFECTURES } from '@/constants/japan';
import type { ConquestEntry, ConquestProject, Photo } from '@/types/app';

type ThemeEntryModalProps = {
  open: boolean;
  onClose: () => void;
  projects: ConquestProject[];
  photos: Photo[];
  userId: string;
  tripId: string;
  initialPhoto?: Photo | null;
  onSave: (entry: ConquestEntry, project?: ConquestProject) => void;
};

export function ThemeEntryModal({
  initialPhoto,
  onClose,
  onSave,
  open,
  photos,
  projects,
  tripId,
  userId
}: ThemeEntryModalProps) {
  const [themeName, setThemeName] = useState(projects[0]?.name ?? DEFAULT_CONQUEST_THEMES[0].name);
  const [customTheme, setCustomTheme] = useState('');
  const [title, setTitle] = useState(initialPhoto?.placeName ?? '');
  const [prefectureId, setPrefectureId] = useState(String(initialPhoto?.prefectureId ?? 26));
  const [placeName, setPlaceName] = useState(initialPhoto?.placeName ?? '');
  const [rating, setRating] = useState('4');
  const [memo, setMemo] = useState('');
  const [photoId, setPhotoId] = useState(initialPhoto?.id ?? '');

  const selectedProject = projects.find((project) => project.name === themeName) ?? null;
  const selectedDefaultTheme = DEFAULT_CONQUEST_THEMES.find((theme) => theme.name === themeName);
  const resolvedThemeName = themeName === 'カスタム' ? customTheme.trim() : themeName;
  const canSave = resolvedThemeName.length > 0 && title.trim().length > 0 && prefectureId.length > 0;

  const linkedPhoto = useMemo(() => photos.find((photo) => photo.id === photoId), [photoId, photos]);

  function save() {
    if (!canSave) {
      return;
    }

    const project =
      selectedProject ??
      ({
        id: `conquest-${Date.now()}`,
        userId,
        name: resolvedThemeName,
        emoji: selectedDefaultTheme?.emoji ?? '🎯',
        color: '#0f8b8d',
        description: null,
        category: selectedDefaultTheme?.category ?? 'custom',
        isPublic: false,
        entries: []
      } satisfies ConquestProject);

    onSave(
      {
        id: `theme-entry-${Date.now()}`,
        projectId: project.id,
        userId,
        tripId,
        photoId: photoId || null,
        prefectureId: Number(prefectureId),
        title: title.trim(),
        memo: memo.trim() || null,
        rating: Number(rating),
        visitedAt: new Date().toISOString(),
        placeName: placeName.trim() || linkedPhoto?.placeName || null,
        lat: linkedPhoto?.lat ?? null,
        lng: linkedPhoto?.lng ?? null,
        source: photoId ? 'photo_suggestion' : 'manual',
        metadata: photoId ? { fromPhoto: true } : {}
      },
      selectedProject ? undefined : project
    );
    onClose();
  }

  return (
    <Modal closeOnOverlayClick onClose={onClose} open={open} testId="theme-entry-modal" title="テーマを記録する">
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">テーマ</span>
          <select className="mt-2 h-11 w-full rounded-lg border border-enadia-line bg-white px-3" value={themeName} onChange={(event) => setThemeName(event.target.value)}>
            {[...projects.map((project) => project.name), ...DEFAULT_CONQUEST_THEMES.map((theme) => theme.name)]
              .filter((value, index, values) => values.indexOf(value) === index)
              .map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
          </select>
        </label>
        {themeName === 'カスタム' ? (
          <input className="h-11 w-full rounded-lg border border-enadia-line px-3" placeholder="カスタムテーマ名" value={customTheme} onChange={(event) => setCustomTheme(event.target.value)} />
        ) : null}
        <input className="h-11 w-full rounded-lg border border-enadia-line px-3" placeholder="タイトル" value={title} onChange={(event) => setTitle(event.target.value)} />
        <select className="h-11 w-full rounded-lg border border-enadia-line bg-white px-3" value={prefectureId} onChange={(event) => setPrefectureId(event.target.value)}>
          {MAP_PREFECTURES.map((prefecture) => (
            <option key={prefecture.id} value={prefecture.id}>
              {prefecture.name}
            </option>
          ))}
        </select>
        <input className="h-11 w-full rounded-lg border border-enadia-line px-3" placeholder="地点名" value={placeName} onChange={(event) => setPlaceName(event.target.value)} />
        <select className="h-11 w-full rounded-lg border border-enadia-line bg-white px-3" value={rating} onChange={(event) => setRating(event.target.value)}>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              評価 {value}
            </option>
          ))}
        </select>
        <textarea className="min-h-24 w-full rounded-lg border border-enadia-line p-3" placeholder="メモ" value={memo} onChange={(event) => setMemo(event.target.value)} />
        <select className="h-11 w-full rounded-lg border border-enadia-line bg-white px-3" value={photoId} onChange={(event) => setPhotoId(event.target.value)}>
          <option value="">写真なし</option>
          {photos.map((photo) => (
            <option key={photo.id} value={photo.id}>
              {photo.placeName ?? photo.id}
            </option>
          ))}
        </select>
        <Button className="w-full" disabled={!canSave} onClick={save}>
          保存
        </Button>
      </div>
    </Modal>
  );
}
