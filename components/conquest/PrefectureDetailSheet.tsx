'use client';

import { Modal } from '@/components/common/Modal';
import { ThemeEntryCard } from '@/components/trips/ThemeEntryCard';
import { getPrefectureName } from '@/constants/japan';
import type { ConquestEntry, ConquestProject, Photo, UserProfile } from '@/types/app';

type PrefectureDetailSheetProps = {
  prefectureId: number | null;
  onClose: () => void;
  entries: ConquestEntry[];
  projects: ConquestProject[];
  photos: Photo[];
  users: UserProfile[];
};

export function PrefectureDetailSheet({ entries, onClose, photos, prefectureId, projects, users }: PrefectureDetailSheetProps) {
  const prefectureEntries = entries.filter((entry) => entry.prefectureId === prefectureId);

  return (
    <Modal onClose={onClose} open={prefectureId !== null} testId="prefecture-detail-sheet" title={getPrefectureName(prefectureId)}>
      <div className="space-y-3">
        {prefectureEntries.length > 0 ? (
          prefectureEntries.map((entry) => (
            <ThemeEntryCard
              entry={entry}
              key={entry.id}
              photo={photos.find((photo) => photo.id === entry.photoId)}
              project={projects.find((project) => project.id === entry.projectId) ?? null}
              user={users.find((user) => user.id === entry.userId) ?? null}
            />
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-enadia-line p-5 text-center text-sm text-enadia-muted">
            この県の記録はまだありません。
          </p>
        )}
      </div>
    </Modal>
  );
}
