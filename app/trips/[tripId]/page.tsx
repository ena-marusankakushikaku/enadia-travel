'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Camera, Share2, UsersRound } from 'lucide-react';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';
import { PhotoFeedCard } from '@/components/photos/PhotoFeedCard';
import { PhotoViewer } from '@/components/photos/PhotoViewer';
import { MockPhoto } from '@/components/photos/MockPhoto';
import { PhotoUploadButton } from '@/components/photos/PhotoUploadButton';
import { TravelMap } from '@/components/trips/TravelMap';
import { ThemeLogPanel } from '@/components/trips/ThemeLogPanel';
import { ThemeEntryModal } from '@/components/trips/ThemeEntryModal';
import { MemberPanel } from '@/components/trips/MemberPanel';
import {
  mockConquestProjects,
  mockCurrentUserId,
  mockTripMembers,
  mockUsers
} from '@/constants/mockData';
import { formatDateRange } from '@/lib/format';
import {
  getMembersByTripId,
  getPhotosByTripId,
  getThemeEntriesByTripId,
  getTripById,
  getUserById
} from '@/lib/mockQueries';
import { canEditTrip, canManageTrip, getTripRole } from '@/lib/permissions';
import type { ConquestEntry, ConquestProject, Photo } from '@/types/app';

type TripTab = 'photos' | 'theme' | 'members';

const tabs: { id: TripTab; label: string }[] = [
  { id: 'photos', label: 'photos' },
  { id: 'theme', label: 'テーマログ' },
  { id: 'members', label: 'members' }
];

export default function TripDetailPage() {
  const params = useParams<{ tripId: string }>();
  const router = useRouter();
  const trip = getTripById(params.tripId);
  const [activeTab, setActiveTab] = useState<TripTab>('photos');
  const [photos, setPhotos] = useState<Photo[]>(() => getPhotosByTripId(params.tripId));
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [themeModalPhoto, setThemeModalPhoto] = useState<Photo | null>(null);
  const [themeProjects, setThemeProjects] = useState<ConquestProject[]>(mockConquestProjects);
  const [themeEntries, setThemeEntries] = useState<ConquestEntry[]>(() => getThemeEntriesByTripId(params.tripId));

  const members = getMembersByTripId(params.tripId);
  const currentRole = getTripRole(params.tripId, mockCurrentUserId, mockTripMembers);
  const canAddContent = canEditTrip(currentRole);
  const canManageMembers = canManageTrip(currentRole);

  if (!trip) {
    return (
      <AppShell title="旅が見つかりません">
        <Button onClick={() => router.push('/trips')} variant="secondary">
          旅一覧へ戻る
        </Button>
      </AppShell>
    );
  }

  const activeTrip = trip;
  const coverPhoto = photos.find((photo) => photo.id === activeTrip.coverPhotoId) ?? photos[0];

  function addMockPhoto() {
    const nextIndex = photos.length;
    const now = new Date().toISOString();
    const nextPhoto: Photo = {
      id: `detail-photo-${Date.now()}`,
      tripId: activeTrip.id,
      uploadedBy: mockCurrentUserId,
      storagePath: `mock/detail-${nextIndex + 1}.jpg`,
      thumbnailPath: null,
      mockImageIndex: nextIndex,
      lat: 35.1 + nextIndex * 0.02,
      lng: 135.7 + nextIndex * 0.02,
      placeName: `${activeTrip.area} mock地点 ${nextIndex + 1}`,
      prefectureId: coverPhoto?.prefectureId ?? null,
      confidence: 0.81,
      aiTags: ['mock', '追加写真', 'AI解析'],
      suggestedThemes: [
        { theme: '絶景', projectId: 'conquest-view', confidence: 82, label: '🗻 絶景' },
        { theme: 'カフェ', projectId: 'conquest-cafe', confidence: 48, label: '☕ カフェ' }
      ],
      aiProcessingStatus: 'completed',
      themeEntryCreated: false,
      capturedAt: now,
      caption: '詳細画面から追加したmock photo。',
      ts: now,
      reactions: [],
      comments: [],
      seenBy: [mockCurrentUserId]
    };

    setPhotos((current) => [nextPhoto, ...current]);
  }

  function saveThemeEntry(entry: ConquestEntry, project?: ConquestProject) {
    if (project) {
      setThemeProjects((current) => [...current, { ...project, entries: [entry] }]);
    }
    setThemeEntries((current) => [entry, ...current]);
    setThemeModalPhoto(null);
    setActiveTab('theme');
  }

  return (
    <AppShell subtitle={currentRole ? `${currentRole} role` : 'no member role'} title="旅詳細">
      <section className="overflow-hidden rounded-lg border border-enadia-line bg-white shadow-sm">
        <div className="relative">
          <MockPhoto className="aspect-[16/10] w-full" index={coverPhoto?.mockImageIndex ?? 0} title={trip.area} />
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
            {canAddContent ? (
              <div className="flex items-start gap-2">
                <PhotoUploadButton tripId={activeTrip.id} />
                <Button icon={<Camera className="h-4 w-4" aria-hidden="true" />} onClick={addMockPhoto} size="sm">
                  mock
                </Button>
              </div>
            ) : null}
          </div>
          {photos.map((photo) => {
            const uploader = getUserById(photo.uploadedBy) ?? mockUsers[0];

            return (
              <PhotoFeedCard
                key={photo.id}
                onComment={() => undefined}
                onOpenPhoto={setSelectedPhoto}
                onReact={() => undefined}
                photo={photo}
                uploader={uploader}
                users={mockUsers}
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
            photos={photos}
            projects={themeProjects}
            tripId={trip.id}
            userId={mockCurrentUserId}
            users={mockUsers}
          />
        </div>
      ) : null}

      {activeTab === 'members' ? (
        <div className="mt-5">
          <MemberPanel
            canManage={canManageMembers}
            currentUserId={mockCurrentUserId}
            members={members}
            tripId={trip.id}
            users={mockUsers}
          />
        </div>
      ) : null}

      <ThemeEntryModal
        initialPhoto={themeModalPhoto}
        onClose={() => setThemeModalPhoto(null)}
        onSave={saveThemeEntry}
        open={themeModalPhoto !== null}
        photos={photos}
        projects={themeProjects}
        tripId={trip.id}
        userId={mockCurrentUserId}
      />
      <PhotoViewer onClose={() => setSelectedPhoto(null)} open={selectedPhoto !== null} photo={selectedPhoto} users={mockUsers} />
    </AppShell>
  );
}
