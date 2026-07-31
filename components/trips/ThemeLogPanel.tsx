'use client';

import { useState } from 'react';
import { ThemeEntryCard } from '@/components/trips/ThemeEntryCard';
import { EditThemeEntryModal } from '@/components/trips/EditThemeEntryModal';
import type { ConquestEntry, ConquestProject, Photo, UserProfile } from '@/types/app';

type ThemeLogPanelProps = {
  canAdd: boolean;
  entries: ConquestEntry[];
  projects: ConquestProject[];
  photos: Photo[];
  users: UserProfile[];
  onSaved?: () => void;
};

export function ThemeLogPanel({ canAdd, entries, onSaved, photos, projects, users }: ThemeLogPanelProps) {
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const editingEntry = entries.find((entry) => entry.id === editingEntryId) ?? null;
  const editingProject = editingEntry
    ? projects.find((project) => project.id === editingEntry.projectId) ?? null
    : null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-enadia-ink">テーマログ</h2>
        <p className="mt-1 text-sm text-enadia-muted">
          {canAdd
            ? '写真にテーマを付けると、ここに記録が並びます。店名や評価は「編集」から追加できます。'
            : 'あなたはこの旅を閲覧のみできます。'}
        </p>
      </div>

      {entries.length > 0 ? (
        entries.map((entry) => (
          <ThemeEntryCard
            entry={entry}
            key={entry.id}
            onEdit={canAdd ? setEditingEntryId : undefined}
            photo={photos.find((photo) => photo.id === entry.photoId)}
            project={projects.find((project) => project.id === entry.projectId) ?? null}
            user={users.find((user) => user.id === entry.userId) ?? null}
          />
        ))
      ) : (
        <p className="rounded-lg border border-dashed border-enadia-line bg-white p-5 text-center text-sm text-enadia-muted">
          テーマログはまだありません。「写真」タブで写真を開き、「テーマを付ける」から記録できます。
        </p>
      )}

      <EditThemeEntryModal
        entry={editingEntry}
        onClose={() => setEditingEntryId(null)}
        onSaved={() => onSaved?.()}
        open={editingEntry !== null}
        project={editingProject}
      />
    </section>
  );
}
