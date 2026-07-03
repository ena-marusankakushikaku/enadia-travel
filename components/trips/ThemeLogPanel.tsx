'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ThemeEntryCard } from '@/components/trips/ThemeEntryCard';
import { ThemeEntryModal } from '@/components/trips/ThemeEntryModal';
import { persistThemeEntry } from '@/lib/api/themeEntriesClient';
import type { ConquestEntry, ConquestProject, Photo, UserProfile } from '@/types/app';

type ThemeLogPanelProps = {
  tripId: string;
  userId: string;
  canAdd: boolean;
  entries: ConquestEntry[];
  projects: ConquestProject[];
  photos: Photo[];
  users: UserProfile[];
  onSaved?: () => void;
};

export function ThemeLogPanel({ canAdd, entries, onSaved, photos, projects, tripId, userId, users }: ThemeLogPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localEntries, setLocalEntries] = useState(entries);
  const [localProjects, setLocalProjects] = useState(projects);
  const [saving, setSaving] = useState(false);

  async function saveEntry(entry: ConquestEntry, project?: ConquestProject) {
    setSaving(true);
    const persisted = await persistThemeEntry(entry, project);
    setSaving(false);
    if (!persisted) {
      return;
    }
    if (persisted.project) {
      setLocalProjects((current) => [...current, { ...persisted.project!, entries: [persisted.entry] }]);
    }
    setLocalEntries((current) => [persisted.entry, ...current]);
    onSaved?.();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-enadia-ink">テーマログ</h2>
          <p className="mt-1 text-sm text-enadia-muted">
            {canAdd ? '旅先で制覇したいテーマを記録できます。' : 'viewerは閲覧のみです。'}
          </p>
        </div>
        {canAdd ? (
          <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setIsOpen(true)} size="sm">
            記録
          </Button>
        ) : null}
      </div>
      {localEntries.length > 0 ? (
        localEntries.map((entry) => (
          <ThemeEntryCard
            entry={entry}
            key={entry.id}
            photo={photos.find((photo) => photo.id === entry.photoId)}
            project={localProjects.find((project) => project.id === entry.projectId) ?? null}
            user={users.find((user) => user.id === entry.userId) ?? null}
          />
        ))
      ) : (
        <p className="rounded-lg border border-dashed border-enadia-line bg-white p-5 text-center text-sm text-enadia-muted">
          テーマログはまだありません。
        </p>
      )}
      <ThemeEntryModal
        onClose={() => setIsOpen(false)}
        onSave={saveEntry}
        open={isOpen}
        photos={photos}
        projects={localProjects}
        tripId={tripId}
        userId={userId}
      />
    </section>
  );
}
