'use client';

import { useState } from 'react';
import { ConquestCard } from '@/components/conquest/ConquestCard';
import { JapanConquestMap } from '@/components/conquest/JapanConquestMap';
import { PrefectureDetailSheet } from '@/components/conquest/PrefectureDetailSheet';
import type { ConquestEntry, ConquestProject, Photo, UserProfile } from '@/types/app';

type ConquestPageClientProps = {
  entries: ConquestEntry[];
  projects: ConquestProject[];
  photos: Photo[];
  users: UserProfile[];
};

export function ConquestPageClient({ entries, photos, projects, users }: ConquestPageClientProps) {
  const [selectedPrefectureId, setSelectedPrefectureId] = useState<number | null>(null);

  return (
    <>
      <div className="space-y-5">
        <JapanConquestMap entries={entries} onSelectPrefecture={setSelectedPrefectureId} />

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-enadia-ink">制覇プロジェクト</h2>

          {projects.length === 0 ? (
            <p className="text-sm text-enadia-muted">プロジェクトがありません。新しく作成してください。</p>
          ) : (
            projects.map((project) => <ConquestCard key={project.id} project={project} />)
          )}
        </section>
      </div>

      {selectedPrefectureId !== null ? (
        <PrefectureDetailSheet
          entries={entries}
          projects={projects}
          photos={photos}
          users={users}
          onClose={() => setSelectedPrefectureId(null)}
          prefectureId={selectedPrefectureId}
        />
      ) : null}
    </>
  );
}
