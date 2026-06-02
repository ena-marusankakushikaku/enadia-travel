'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { AddConquestEntryModal } from '@/components/conquest/AddConquestEntryModal';
import { JapanConquestMap } from '@/components/conquest/JapanConquestMap';
import { ThemeEntryCard } from '@/components/trips/ThemeEntryCard';
import type { ConquestEntry, ConquestProject, Photo, UserProfile } from '@/types/app';

type ConquestDetailProps = {
  project: ConquestProject;
  photos: Photo[];
  users: UserProfile[];
  userId: string;
};

export function ConquestDetail({ photos, project, userId, users }: ConquestDetailProps) {
  const [entries, setEntries] = useState(project.entries);
  const [isOpen, setIsOpen] = useState(false);
  const prefectureCount = new Set(entries.map((entry) => entry.prefectureId)).size;
  const progress = Math.round((prefectureCount / 47) * 100);

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-enadia-line bg-white p-5 shadow-sm">
        <p className="text-3xl">{project.emoji}</p>
        <h1 className="mt-2 text-2xl font-bold text-enadia-ink">{project.name}</h1>
        {project.description ? <p className="mt-2 text-sm leading-relaxed text-enadia-muted">{project.description}</p> : null}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-2xl font-bold text-enadia-ink">{progress}%</p>
            <p className="text-xs text-enadia-muted">制覇率</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-2xl font-bold text-enadia-ink">{prefectureCount}</p>
            <p className="text-xs text-enadia-muted">達成都道府県</p>
          </div>
        </div>
      </div>
      <JapanConquestMap entries={entries} onSelectPrefecture={() => undefined} />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-enadia-ink">記録一覧</h2>
        <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setIsOpen(true)} size="sm">
          追加
        </Button>
      </div>
      {entries.map((entry) => (
        <ThemeEntryCard
          entry={entry}
          key={entry.id}
          onDelete={(entryId) => setEntries((current) => current.filter((item) => item.id !== entryId))}
          photo={photos.find((photo) => photo.id === entry.photoId)}
          project={project}
          user={users.find((user) => user.id === entry.userId) ?? null}
        />
      ))}
      <AddConquestEntryModal
        onAdd={(entry: ConquestEntry) => setEntries((current) => [entry, ...current])}
        onClose={() => setIsOpen(false)}
        open={isOpen}
        photos={photos}
        projectId={project.id}
        userId={userId}
      />
    </section>
  );
}
