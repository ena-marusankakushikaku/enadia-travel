'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { clsx } from 'clsx';
import { AddConquestEntryModal } from '@/components/conquest/AddConquestEntryModal';
import { JapanConquestMap } from '@/components/conquest/JapanConquestMap';
import { WorldConquestMap } from '@/components/conquest/WorldConquestMap';
import { ThemeEntryCard } from '@/components/trips/ThemeEntryCard';
import { EditThemeEntryModal } from '@/components/trips/EditThemeEntryModal';
import {
  collectEntryLocations,
  countAchievedPrefectures,
  PREFECTURE_TOTAL,
  prefectureProgress
} from '@/lib/conquest/progress';
import type { ConquestProject, Photo, UserProfile } from '@/types/app';

type ConquestDetailProps = {
  project: ConquestProject;
  photos: Photo[];
  users: UserProfile[];
  userId: string;
  /** 海外で記録した国の数。日本は含まない。サーバー側で数えて渡す */
  overseasCountryCount: number;
};

type MapMode = 'japan' | 'world';

export function ConquestDetail({
  overseasCountryCount,
  photos,
  project,
  userId,
  users
}: ConquestDetailProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>('japan');

  const entries = project.entries;
  const editingEntry = entries.find((entry) => entry.id === editingEntryId) ?? null;
  const prefectureCount = countAchievedPrefectures(entries);
  const progress = prefectureProgress(entries);
  const achievedPrefectureIds = entries
    .map((entry) => entry.prefectureId)
    .filter((id): id is number => id !== null);

  async function deleteEntry(entryId: string) {
    if (deletingId) {
      return;
    }

    if (!window.confirm('この記録を削除しますか？')) {
      return;
    }

    setDeletingId(entryId);
    setError(null);

    try {
      const response = await fetch(`/api/conquest-entries/${entryId}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? '削除に失敗しました。');
        return;
      }
      router.refresh();
    } catch {
      setError('通信に失敗しました。時間をおいて試してください。');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-enadia-line bg-white p-5 shadow-sm">
        <p className="text-3xl">{project.emoji}</p>
        <h1 className="mt-2 text-2xl font-bold text-enadia-ink">{project.name}</h1>
        {project.description ? (
          <p className="mt-2 text-sm leading-relaxed text-enadia-muted">{project.description}</p>
        ) : null}
        {/* 日本は「47県のうち何県」、海外は「何か国」。単位が違うので率でまとめず並べる */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-2xl font-bold text-enadia-ink">{progress}%</p>
            <p className="text-xs text-enadia-muted">日本の制覇率</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-2xl font-bold text-enadia-ink">{prefectureCount}</p>
            <p className="text-xs text-enadia-muted">達成 / {PREFECTURE_TOTAL}県</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-2xl font-bold text-enadia-ink">{overseasCountryCount}</p>
            <p className="text-xs text-enadia-muted">海外の国数</p>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-enadia-ink">表示する地図</h2>
          <div className="flex rounded-full border border-enadia-line bg-white p-0.5">
            {([
              { id: 'japan', label: '日本' },
              { id: 'world', label: '海外' }
            ] as { id: MapMode; label: string }[]).map((button) => (
              <button
                className={clsx(
                  'rounded-full px-3 py-1 text-xs font-bold transition',
                  mapMode === button.id ? 'bg-enadia-ink text-white' : 'text-enadia-muted hover:bg-slate-50'
                )}
                key={button.id}
                onClick={() => setMapMode(button.id)}
                type="button"
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>

        {mapMode === 'japan' ? (
          <JapanConquestMap
            achievedPrefectureIds={achievedPrefectureIds}
            caption={`${project.name}の記録がある都道府県を色分けしています。`}
            onSelectPrefecture={() => undefined}
          />
        ) : (
          <WorldConquestMap
            caption={`${project.name}の記録がある国を色分けしています。`}
            locations={collectEntryLocations(entries, photos)}
          />
        )}
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-enadia-ink">記録一覧</h2>
        <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setIsOpen(true)} size="sm">
          追加
        </Button>
      </div>

      {error ? <p className="text-sm text-enadia-danger">{error}</p> : null}

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-enadia-line bg-white p-6 text-center text-sm text-enadia-muted">
          まだ記録がありません。「追加」から、旅先で出会ったものを記録しましょう。
        </p>
      ) : (
        entries.map((entry) => (
          <ThemeEntryCard
            entry={entry}
            key={entry.id}
            onDelete={deleteEntry}
            onEdit={setEditingEntryId}
            photo={photos.find((photo) => photo.id === entry.photoId)}
            project={project}
            user={users.find((user) => user.id === entry.userId) ?? null}
          />
        ))
      )}

      <AddConquestEntryModal
        onClose={() => setIsOpen(false)}
        onSaved={() => router.refresh()}
        open={isOpen}
        photos={photos}
        projectId={project.id}
        userId={userId}
      />

      <EditThemeEntryModal
        entry={editingEntry}
        onClose={() => setEditingEntryId(null)}
        onSaved={() => router.refresh()}
        open={editingEntry !== null}
        project={project}
      />
    </section>
  );
}
