'use client';

import { useState } from 'react';
import { CalendarDays, Camera, Loader2, MapPin, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';
import { PhotoFeedCard } from '@/components/photos/PhotoFeedCard';
import { PhotoViewer } from '@/components/photos/PhotoViewer';
import { TravelMap } from '@/components/trips/TravelMap';
import { mockCurrentUserId, mockUsers } from '@/constants/mockData';
import type { Photo } from '@/types/app';

const mockDetectedPlaces = [
  {
    placeName: '尾道水道',
    prefectureId: 34,
    confidence: 0.92,
    lat: 34.4089,
    lng: 133.2054
  },
  {
    placeName: '千光寺公園',
    prefectureId: 34,
    confidence: 0.88,
    lat: 34.4141,
    lng: 133.1991
  },
  {
    placeName: 'しまなみ海道',
    prefectureId: 34,
    confidence: 0.84,
    lat: 34.3907,
    lng: 133.1834
  }
];

export default function NewTripPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const currentUser = mockUsers.find((user) => user.id === mockCurrentUserId) ?? mockUsers[0];

  function addMockPhoto() {
    const detectedPlace = mockDetectedPlaces[photos.length % mockDetectedPlaces.length];

    setIsAnalyzing(true);
    window.setTimeout(() => {
      const nextPhoto: Photo = {
        id: `new-photo-${Date.now()}`,
        tripId: 'draft-trip',
        uploadedBy: mockCurrentUserId,
        storagePath: `mock/new-${photos.length + 1}.jpg`,
        thumbnailPath: null,
        mockImageIndex: photos.length,
        lat: detectedPlace.lat,
        lng: detectedPlace.lng,
        placeName: detectedPlace.placeName,
        prefectureId: detectedPlace.prefectureId,
        confidence: detectedPlace.confidence,
        aiTags: ['mock', 'AI解析', '旅写真'],
        capturedAt: new Date().toISOString(),
        suggestedThemes: [
          { theme: '絶景', projectId: 'conquest-view', confidence: 82, label: '🗻 絶景' },
          { theme: 'カフェ', projectId: 'conquest-cafe', confidence: 54, label: '☕ カフェ' }
        ],
        aiProcessingStatus: 'completed',
        themeEntryCreated: false,
        caption: `${detectedPlace.placeName}で追加したmock photo。`,
        ts: new Date().toISOString(),
        reactions: [],
        comments: [],
        seenBy: [mockCurrentUserId]
      };

      setPhotos((current) => [...current, nextPhoto]);
      setIsAnalyzing(false);
    }, 700);
  }

  return (
    <AppShell subtitle="mock photo analysis" title="旅を作成">
      <form className="space-y-5">
        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">旅名</span>
          <input
            className="mt-2 h-12 w-full rounded-lg border border-enadia-line bg-white px-3 text-base outline-none focus:border-enadia-primary focus:ring-2 focus:ring-teal-100"
            defaultValue="初夏の瀬戸内リサーチ旅"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">日付</span>
          <div className="mt-2 flex items-center rounded-lg border border-enadia-line bg-white px-3">
            <CalendarDays className="h-4 w-4 text-enadia-muted" aria-hidden="true" />
            <input className="h-12 min-w-0 flex-1 px-2 outline-none" defaultValue="2026/06/14 - 2026/06/16" />
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">エリア</span>
          <div className="mt-2 flex items-center rounded-lg border border-enadia-line bg-white px-3">
            <MapPin className="h-4 w-4 text-enadia-muted" aria-hidden="true" />
            <input className="h-12 min-w-0 flex-1 px-2 outline-none" defaultValue="広島・尾道" />
          </div>
        </label>

        <section className="rounded-lg border border-enadia-line bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-enadia-ink">写真追加モック</h2>
              <p className="mt-1 text-sm text-enadia-muted">AI Vision接続前の解析フロー確認です。</p>
            </div>
            <Button
              disabled={isAnalyzing}
              icon={<Camera className="h-4 w-4" aria-hidden="true" />}
              loading={isAnalyzing}
              onClick={addMockPhoto}
              size="sm"
              variant="secondary"
            >
              追加
            </Button>
          </div>
          {isAnalyzing ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-3 text-sm font-semibold text-enadia-primary">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              写真を解析中...
            </div>
          ) : null}
        </section>

        {photos.length >= 2 ? <TravelMap photos={photos} /> : null}

        {photos.length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-enadia-primary" aria-hidden="true" />
              <h2 className="text-base font-bold text-enadia-ink">追加済み写真</h2>
            </div>
            {photos.map((photo) => (
              <PhotoFeedCard
                key={photo.id}
                onComment={() => undefined}
                onOpenPhoto={setSelectedPhoto}
                onReact={() => undefined}
                photo={photo}
                uploader={currentUser}
                users={mockUsers}
              />
            ))}
          </section>
        ) : null}

        <Button className="w-full" size="lg" variant="primary">
          mockで作成
        </Button>
      </form>

      <PhotoViewer
        onClose={() => setSelectedPhoto(null)}
        open={selectedPhoto !== null}
        photo={selectedPhoto}
        users={mockUsers}
      />
    </AppShell>
  );
}
