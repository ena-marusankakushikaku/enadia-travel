'use client';

import { Modal } from '@/components/common/Modal';
import { ThemeEntryCard } from '@/components/trips/ThemeEntryCard';
import { MockPhoto } from '@/components/photos/MockPhoto';
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

export function PrefectureDetailSheet({
  entries,
  onClose,
  photos,
  prefectureId,
  projects,
  users
}: PrefectureDetailSheetProps) {
  const prefectureEntries = entries.filter((entry) => entry.prefectureId === prefectureId);
  const prefecturePhotos = photos.filter((photo) => photo.prefectureId === prefectureId);

  return (
    <Modal onClose={onClose} open={prefectureId !== null} testId="prefecture-detail-sheet" title={getPrefectureName(prefectureId)}>
      <div className="space-y-5">
        <section>
          <h3 className="text-sm font-bold text-enadia-ink">この県の写真（{prefecturePhotos.length}枚）</h3>
          {prefecturePhotos.length > 0 ? (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {prefecturePhotos.map((photo) => (
                <div key={photo.id}>
                  <MockPhoto className="aspect-square w-full rounded-lg" src={photo.thumbnailUrl ?? photo.imageUrl} title={null} />
                  <p className="mt-1 line-clamp-2 text-[11px] text-enadia-muted">{photo.placeName ?? '地点未設定'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 rounded-lg border border-dashed border-enadia-line p-4 text-center text-xs text-enadia-muted">
              この県の写真はまだありません。
            </p>
          )}
        </section>

        <section>
          <h3 className="text-sm font-bold text-enadia-ink">テーマ記録（{prefectureEntries.length}件）</h3>
          <div className="mt-2 space-y-3">
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
              <p className="rounded-lg border border-dashed border-enadia-line p-4 text-center text-xs text-enadia-muted">
                この県のテーマ記録はまだありません。旅の詳細画面から記録できます。
              </p>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
}
