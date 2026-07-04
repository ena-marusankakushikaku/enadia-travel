'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Share2, UsersRound } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PhotoFeedCard } from '@/components/photos/PhotoFeedCard';
import { PhotoViewer } from '@/components/photos/PhotoViewer';
import { MockPhoto } from '@/components/photos/MockPhoto';
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
  { id: 'photos', label: 'photos' },
  { id: 'theme', label: 'テーマログ' },
  { id: 'members', label: 'members' }
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
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [themeModalPhoto, setThemeModalPhoto] = useState<Photo | null>(null);

  const canAddContent = canEditTrip(currentRole);
  const canManageMembers = canManageTrip(currentRole);
  const coverPhoto = photos.find((photo) => photo.id === trip.coverPhotoId) ?? photos[0];

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
      <section className="overflow-hidden rounded-lg border border-enadia-line bg-white shadow-sm">
        <div className="relative">
          <MockPhoto className="aspect-[16/10] w-full" src={coverPhoto?.imageUrl} title={trip.area} />
          <button
            aria-label="戻る"
            className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-4 p-4">
          <div>
            <h1 className="text-2xl font-bold text-enadia-ink">{trip.title}</h1>
            <p className="mt-1 text-sm text-enadia-muted">{formatDateRange(trip.startsAt, trip.endsAt)}</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-enadia-muted">
            <UsersRound className="h-4 w-4" aria-hidden="true" />
            {members.length} members
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button icon={<Bot className="h-4 w-4" aria-hidden="true" />} variant="secondary">
              AI編集
            </Button>
            <Button icon={<Share2 className="h-4 w-4" aria-hidden="true" />} variant="secondary">
              共有
            </Button>
          </div>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-3 rounded-lg border border-enadia-line bg-white p-1">
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
        <section className="mt-5 space-y-4">
          {photos.length >= 2 ? <TravelMap onAddThemeFromPhoto={canAddContent ? setThemeModalPhoto : undefined} photos={photos} /> : null}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-enadia-ink">写真一覧</h2>
              <p className="mt-1 text-sm text-enadia-muted">
                {canAddContent ? '写真追加とテーマログ化ができます。' : 'viewerは閲覧のみです。'}
              </p>
            </div>
            {canAddContent ? <PhotoUploadButton onUploaded={() => router.refresh()} tripId={trip.id} /> : null}
          </div>
          {photos.length === 0 ? (
            <p className="rounded-lg border border-dashed border-enadia-line bg-white p-5 text-center text-sm text-enadia-muted">
              写真はまだありません。
            </p>
          ) : null}
          {photos.map((photo) => {
            const uploader = users.find((user) => user.id === photo.uploadedBy) ?? users[0];

            return (
              <PhotoFeedCard
                key={photo.id}
                onComment={() => undefined}
                onOpenPhoto={setSelectedPhoto}
                onReact={() => undefined}
                photo={photo}
                uploader={uploader}
                users={users}
              />
            );
          })}
        </section>
      ) : null}

      {activeTab === 'theme' ? (
        <div className="mt-5">
          <ThemeLogPanel
            canAdd={canAddContent}
            entries={themeEntries}
            key={themeEntries.map((entry) => entry.id).join(',')}
            onSaved={() => router.refresh()}
            photos={photos}
            projects={themeProjects}
            tripId={trip.id}
            userId={currentUserId}
            users={users}
          />
        </div>
      ) : null}

      {activeTab === 'members' ? (
        <div className="mt-5">
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
      <PhotoViewer onClose={() => setSelectedPhoto(null)} open={selectedPhoto !== null} photo={selectedPhoto} users={users} />
    </>
  );
}
