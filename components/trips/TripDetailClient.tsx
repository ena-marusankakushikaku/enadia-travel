'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Share2, UsersRound } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PhotoGrid } from '@/components/photos/PhotoGrid';
import { PhotoDetailViewer } from '@/components/photos/PhotoDetailViewer';
import { PhotoLocationModal } from '@/components/photos/PhotoLocationModal';
import { PhotoUploadButton } from '@/components/photos/PhotoUploadButton';
import { TravelMap } from '@/components/trips/TravelMap';
import { ThemeLogPanel } from '@/components/trips/ThemeLogPanel';
import { ThemeEntryModal } from '@/components/trips/ThemeEntryModal';
import { MemberPanel } from '@/components/trips/MemberPanel';
import { formatDateRange } from '@/lib/format';
import { persistThemeEntry } from '@/lib/api/themeEntriesClient';
import { canEditTrip, canManageTrip } from '@/lib/permissions';
import type { ConquestEntry, ConquestProject, Photo, Trip, TripMember, TripRole, UserProfile } from '@/types/app';

type TripDetailClientProps = {
  trip: Trip;
  photos: Photo[];
  members: TripMember[];
  themeEntries: ConquestEntry[];
  themeProjects: ConquestProject[];
  users: UserProfile[];
  currentUserId: string;
  currentRole: TripRole | null;
};

type TripTab = 'photos' | 'theme' | 'members';

const tabs: { id: TripTab; label: string }[] = [
  { id: 'photos', label: '写真' },
  { id: 'theme', label: 'テーマログ' },
  { id: 'members', label: 'メンバー' }
];

export function TripDetailClient({
  currentRole,
  currentUserId,
  members,
  photos,
  themeEntries,
  themeProjects,
  trip,
  users
}: TripDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TripTab>('photos');
  const [viewerPhotoId, setViewerPhotoId] = useState<string | null>(null);
  const [themeModalPhoto, setThemeModalPhoto] = useState<Photo | null>(null);
  const [locationModalPhoto, setLocationModalPhoto] = useState<Photo | null>(null);
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  const canAddContent = canEditTrip(currentRole);
  const canManageMembers = canManageTrip(currentRole);

  async function saveThemeEntryFromMap(entry: ConquestEntry, project?: ConquestProject) {
    const persisted = await persistThemeEntry(entry, project);
    setThemeModalPhoto(null);
    if (persisted) {
      setActiveTab('theme');
      router.refresh();
    }
  }

  return (
    <>
      <section className="rounded-lg border border-enadia-line bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <button
            aria-label="戻る"
            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-enadia-muted transition hover:bg-slate-200"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold text-enadia-ink">{trip.title}</h1>
            <p className="mt-1 text-sm text-enadia-muted">
              {formatDateRange(trip.startsAt, trip.endsAt)}
              {trip.area ? ` ・ ${trip.area}` : ''}
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs font-semibold text-enadia-muted">
              <span className="inline-flex items-center gap-1">
                <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
                {members.length}人
              </span>
              <span>写真 {photos.length}枚</span>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            icon={<Bot className="h-4 w-4" aria-hidden="true" />}
            onClick={() => setComingSoon('AI編集')}
            size="sm"
            variant="secondary"
          >
            AI編集
          </Button>
          <Button
            icon={<Share2 className="h-4 w-4" aria-hidden="true" />}
            onClick={() => setComingSoon('共有')}
            size="sm"
            variant="secondary"
          >
            共有
          </Button>
        </div>
        {comingSoon ? (
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-enadia-muted">
            「{comingSoon}」は準備中です。
            {comingSoon === '共有' ? '今は「メンバー」タブから招待できます。' : ''}
          </p>
        ) : null}
      </section>

      <div className="mt-4 grid grid-cols-3 rounded-lg border border-enadia-line bg-white p-1">
        {tabs.map((tab) => (
          <button
            className={`h-10 rounded-md text-sm font-bold transition ${
              activeTab === tab.id ? 'bg-enadia-ink text-white' : 'text-enadia-muted hover:bg-slate-50'
            }`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'photos' ? (
        <section className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-enadia-muted">
              {canAddContent ? '写真をタップすると、いいね・コメント・テーマ付けができます。' : 'viewerは閲覧のみです。'}
            </p>
            {canAddContent ? <PhotoUploadButton onUploaded={() => router.refresh()} tripId={trip.id} /> : null}
          </div>

          <PhotoGrid currentUserId={currentUserId} onOpenPhoto={setViewerPhotoId} photos={photos} />

          {photos.length >= 2 ? (
            <TravelMap onAddThemeFromPhoto={canAddContent ? setThemeModalPhoto : undefined} photos={photos} />
          ) : null}
        </section>
      ) : null}

      {activeTab === 'theme' ? (
        <div className="mt-4">
          <ThemeLogPanel
            canAdd={canAddContent}
            entries={themeEntries}
            onSaved={() => router.refresh()}
            photos={photos}
            projects={themeProjects}
            users={users}
          />
        </div>
      ) : null}

      {activeTab === 'members' ? (
        <div className="mt-4">
          <MemberPanel
            canManage={canManageMembers}
            currentUserId={currentUserId}
            members={members}
            onChanged={() => router.refresh()}
            tripId={trip.id}
            users={users}
          />
        </div>
      ) : null}

      <ThemeEntryModal
        initialPhoto={themeModalPhoto}
        onClose={() => setThemeModalPhoto(null)}
        onSave={saveThemeEntryFromMap}
        open={themeModalPhoto !== null}
        photos={photos}
        projects={themeProjects}
        tripId={trip.id}
        userId={currentUserId}
      />

      <PhotoDetailViewer
        canEdit={canAddContent}
        currentUserId={currentUserId}
        onChanged={() => router.refresh()}
        onClose={() => setViewerPhotoId(null)}
        onEditLocation={(photo) => setLocationModalPhoto(photo)}
        photoId={viewerPhotoId}
        photos={photos}
        projects={themeProjects}
        themeEntries={themeEntries}
        tripId={trip.id}
        users={users}
      />

      <PhotoLocationModal
        onClose={() => setLocationModalPhoto(null)}
        onSaved={() => router.refresh()}
        open={locationModalPhoto !== null}
        photo={locationModalPhoto}
      />
    </>
  );
}
