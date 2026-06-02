'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '@/components/common/AppShell';
import { ConquestCard } from '@/components/conquest/ConquestCard';
import { JapanConquestMap } from '@/components/conquest/JapanConquestMap';
import { PrefectureDetailSheet } from '@/components/conquest/PrefectureDetailSheet';
import type { ConquestEntry, ConquestProject, Photo, UserProfile } from '@/types/app';

const mockUsers = [
  {
    id: 'user-naoki',
    displayName: 'なおき',
    avatarUrl: null,
    language: 'ja',
    countryCode: 'JP',
  },
] as unknown as UserProfile[];

const mockPhotos = [
  {
    id: 'photo-kyoto-001',
    tripId: 'trip-kyoto-2026',
    uploadedBy: 'user-naoki',
    storagePath: '',
    thumbnailPath: null,
    mockImageIndex: 1,
    lat: 34.9949,
    lng: 135.785,
    placeName: '清水寺',
    prefectureId: 26,
    confidence: 92,
    aiTags: ['神社仏閣', '絶景', '京都'],
    suggestedThemes: [
      {
        theme: '神社仏閣',
        projectId: 'conquest-temple',
        confidence: 92,
        label: '神社仏閣',
      },
    ],
    capturedAt: '2026-04-01T10:00:00.000Z',
    aiProcessingStatus: 'completed',
    themeEntryCreated: true,
    caption: '清水寺で撮影した旅の記録',
    ts: '2026-04-01T10:00:00.000Z',
    reactions: [],
    comments: [],
    seenBy: [],
  },
] as unknown as Photo[];

const mockConquestProjects = [
  {
    id: 'conquest-sake',
    userId: 'user-naoki',
    name: '地酒',
    emoji: '🍶',
    color: '#8B6914',
    description: '全国の地酒を旅先で記録する',
    category: 'drink',
    isPublic: false,
    entries: [],
  },
  {
    id: 'conquest-ramen',
    userId: 'user-naoki',
    name: 'ラーメン',
    emoji: '🍜',
    color: '#E65100',
    description: 'ご当地ラーメンを制覇する',
    category: 'food',
    isPublic: false,
    entries: [],
  },
  {
    id: 'conquest-temple',
    userId: 'user-naoki',
    name: '神社仏閣',
    emoji: '⛩️',
    color: '#C62828',
    description: '旅先の神社仏閣を記録する',
    category: 'culture',
    isPublic: false,
    entries: [],
  },
] as unknown as ConquestProject[];

const mockConquestEntries = [
  {
    id: 'entry-kyoto-temple-001',
    projectId: 'conquest-temple',
    userId: 'user-naoki',
    tripId: 'trip-kyoto-2026',
    photoId: 'photo-kyoto-001',
    prefectureId: 26,
    title: '清水寺',
    memo: '京都旅行で訪問。写真からテーマログに追加。',
    rating: 5,
    visitedAt: '2026-04-01',
    placeName: '清水寺',
    lat: 34.9949,
    lng: 135.785,
    source: 'photo_suggestion',
    metadata: {},
  },
  {
    id: 'entry-ishikawa-sake-001',
    projectId: 'conquest-sake',
    userId: 'user-naoki',
    tripId: 'trip-kanazawa-2026',
    photoId: null,
    prefectureId: 17,
    title: '金沢の地酒',
    memo: '金沢旅行で記録。',
    rating: 4,
    visitedAt: '2026-04-10',
    placeName: '金沢',
    lat: 36.5613,
    lng: 136.6562,
    source: 'manual',
    metadata: {},
  },
] as unknown as ConquestEntry[];

export default function ConquestPage() {
  const [selectedPrefectureId, setSelectedPrefectureId] = useState<number | null>(null);

  const conquestEntries = useMemo(() => mockConquestEntries, []);
  const conquestProjects = useMemo(() => mockConquestProjects, []);
  const photos = useMemo(() => mockPhotos, []);
  const users = useMemo(() => mockUsers, []);

  return (
    <AppShell subtitle="テーマごとの全国制覇" title="制覇">
      <div className="space-y-5">
        <JapanConquestMap
          entries={conquestEntries}
          onSelectPrefecture={setSelectedPrefectureId}
        />

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-enadia-ink">
            制覇プロジェクト
          </h2>

          {conquestProjects.length === 0 ? (
            <p className="text-sm text-enadia-muted">
              プロジェクトがありません。新しく作成してください。
            </p>
          ) : (
            conquestProjects.map((project) => (
              <ConquestCard key={project.id} project={project} />
            ))
          )}
        </section>
      </div>

      {selectedPrefectureId !== null ? (
        <PrefectureDetailSheet
          entries={conquestEntries}
          projects={conquestProjects}
          photos={photos}
          users={users}
          onClose={() => setSelectedPrefectureId(null)}
          prefectureId={selectedPrefectureId}
        />
      ) : null}
    </AppShell>
  );
}
