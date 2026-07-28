'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ConquestCard } from '@/components/conquest/ConquestCard';
import { CreateConquestProjectModal } from '@/components/conquest/CreateConquestProjectModal';
import { JapanConquestMap } from '@/components/conquest/JapanConquestMap';
import { PrefectureDetailSheet } from '@/components/conquest/PrefectureDetailSheet';
import type { ConquestEntry, ConquestProject, Photo, UserProfile } from '@/types/app';

type ConquestPageClientProps = {
  entries: ConquestEntry[];
  projects: ConquestProject[];
  photos: Photo[];
  users: UserProfile[];
};

const ALL = 'all';

export function ConquestPageClient({ entries, photos, projects, users }: ConquestPageClientProps) {
  const router = useRouter();
  const [selectedPrefectureId, setSelectedPrefectureId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(ALL);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
        )
      );
    }

    const fromPhotos = photos
      .map((photo) => photo.prefectureId)
      .filter((id): id is number => id !== null);
    const fromEntries = entries.map((entry) => entry.prefectureId);

    return Array.from(new Set([...fromPhotos, ...fromEntries]));
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

        <JapanConquestMap
          achievedPrefectureIds={achievedPrefectureIds}
          caption={caption}
          onSelectPrefecture={setSelectedPrefectureId}
        />

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
            projects.map((project) => <ConquestCard key={project.id} project={project} />)
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
