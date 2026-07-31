'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ConquestCard } from '@/components/conquest/ConquestCard';
import { CreateConquestProjectModal } from '@/components/conquest/CreateConquestProjectModal';
import { JapanConquestMap } from '@/components/conquest/JapanConquestMap';
import { WorldConquestMap } from '@/components/conquest/WorldConquestMap';
import { PrefectureDetailSheet } from '@/components/conquest/PrefectureDetailSheet';
import type { ConquestEntry, ConquestProject, Photo, UserProfile } from '@/types/app';

type ConquestPageClientProps = {
  entries: ConquestEntry[];
  projects: ConquestProject[];
  photos: Photo[];
  users: UserProfile[];
  /** テーマIDごとの、海外で記録した国の数。世界地図データを読まずに済むようサーバー側で数えている */
  overseasCountryCountByProject: Record<string, number>;
};

const ALL = 'all';

type MapMode = 'japan' | 'world';

export function ConquestPageClient({
  entries,
  overseasCountryCountByProject,
  photos,
  projects,
  users
}: ConquestPageClientProps) {
  const router = useRouter();
  const [selectedPrefectureId, setSelectedPrefectureId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(ALL);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>('japan');

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;

  // 「すべて」のときは、テーマ記録が無くても写真の位置情報から訪問済みの県を塗る。
  // テーマを選んだときは、そのテーマの記録がある県だけに絞り込む。
  const achievedPrefectureIds = useMemo(() => {
    if (selectedProjectId !== ALL) {
      return Array.from(
        new Set(
          entries
            .filter((entry) => entry.projectId === selectedProjectId)
            .map((entry) => entry.prefectureId)
            .filter((id): id is number => id !== null)
        )
      );
    }

    const fromPhotos = photos
      .map((photo) => photo.prefectureId)
      .filter((id): id is number => id !== null);
    const fromEntries = entries
      .map((entry) => entry.prefectureId)
      .filter((id): id is number => id !== null);

    return Array.from(new Set([...fromPhotos, ...fromEntries]));
  }, [entries, photos, selectedProjectId]);

  // 世界地図の色分けに使う座標。
  // 「すべて」なら手持ちの写真すべて、テーマを選んだときはそのテーマに紐づく写真と記録。
  const achievedLocations = useMemo(() => {
    if (selectedProjectId === ALL) {
      return photos.map((photo) => ({ lat: photo.lat, lng: photo.lng }));
    }

    const themeEntries = entries.filter((entry) => entry.projectId === selectedProjectId);
    const photoIds = new Set(themeEntries.map((entry) => entry.photoId).filter((id): id is string => id !== null));

    return [
      ...photos.filter((photo) => photoIds.has(photo.id)).map((photo) => ({ lat: photo.lat, lng: photo.lng })),
      ...themeEntries.map((entry) => ({ lat: entry.lat ?? null, lng: entry.lng ?? null }))
    ];
  }, [entries, photos, selectedProjectId]);

  const entryCountByProject = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      counts.set(entry.projectId, (counts.get(entry.projectId) ?? 0) + 1);
    }
    return counts;
  }, [entries]);

  const caption =
    selectedProjectId === ALL
      ? '写真の位置情報とテーマ記録から、訪れた都道府県を色分けしています。'
      : `${selectedProject?.name ?? 'テーマ'}の記録がある都道府県だけを表示しています。`;

  const worldCaption =
    selectedProjectId === ALL
      ? '位置情報のある写真から、訪れた国を色分けしています。日本国内の写真も含まれます。'
      : `${selectedProject?.name ?? 'テーマ'}に紐づく写真・記録から、訪れた国を色分けしています。`;

  const filterButtons = [
    { id: ALL, label: '🗾 すべて', count: achievedPrefectureIds.length },
    ...projects.map((project) => ({
      id: project.id,
      label: `${project.emoji} ${project.name}`,
      count: entryCountByProject.get(project.id) ?? 0
    }))
  ];

  return (
    <>
      <div className="space-y-5">
        <section>
          <h2 className="text-sm font-bold text-enadia-ink">表示するテーマ</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {filterButtons.map((button) => (
              <button
                className={clsx(
                  'rounded-full border px-3 py-1.5 text-xs font-bold transition',
                  selectedProjectId === button.id
                    ? 'border-enadia-primary bg-enadia-primary text-white'
                    : 'border-enadia-line bg-white text-enadia-muted hover:bg-slate-50'
                )}
                key={button.id}
                onClick={() => setSelectedProjectId(button.id)}
                type="button"
              >
                {button.label}
                <span className="ml-1.5 opacity-75">{button.count}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-enadia-ink">表示する地図</h2>
            <div className="flex rounded-full border border-enadia-line bg-white p-0.5">
              {([
                // 「日本」の対になる言葉としては「世界」より「海外」のほうが自然
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
              caption={caption}
              onSelectPrefecture={setSelectedPrefectureId}
            />
          ) : (
            <WorldConquestMap caption={worldCaption} locations={achievedLocations} />
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-enadia-ink">制覇プロジェクト</h2>
            <Button
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() => setIsCreateOpen(true)}
              size="sm"
            >
              テーマを作成
            </Button>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-enadia-line bg-white p-6 text-center">
              <p className="text-sm text-enadia-muted">
                まだテーマがありません。「地酒」「温泉」など集めたいテーマを作ると、旅の記録がここに集まります。
              </p>
              <Button
                className="mx-auto mt-4"
                icon={<Plus className="h-4 w-4" aria-hidden="true" />}
                onClick={() => setIsCreateOpen(true)}
              >
                最初のテーマを作成
              </Button>
            </div>
          ) : (
            projects.map((project) => (
              <ConquestCard
                key={project.id}
                overseasCountryCount={overseasCountryCountByProject[project.id] ?? 0}
                project={project}
              />
            ))
          )}
        </section>
      </div>

      <CreateConquestProjectModal
        existingNames={projects.map((project) => project.name)}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => router.refresh()}
        open={isCreateOpen}
      />

      {selectedPrefectureId !== null ? (
        <PrefectureDetailSheet
          entries={entries}
          onClose={() => setSelectedPrefectureId(null)}
          photos={photos}
          prefectureId={selectedPrefectureId}
          projects={projects}
          users={users}
        />
      ) : null}
    </>
  );
}
