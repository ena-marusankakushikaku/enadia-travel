import type {
  ConquestEntry,
  ConquestProject,
  Photo,
  PhotoFeedItem,
  TourismEvent,
  Trip,
  TripMember,
  UserConsent,
  UserProfile,
  UserStats
} from '@/types/app';
import { getTripRole } from '@/lib/permissions';

export const mockCurrentUserId = 'user-naoki';

export const mockUsers: UserProfile[] = [
  {
    id: 'user-naoki',
    displayName: 'Naoki',
    avatarUrl: null,
    plan: 'pro',
    homePrefectureId: 13
  },
  {
    id: 'user-aoi',
    displayName: 'Aoi',
    avatarUrl: null,
    plan: 'free',
    homePrefectureId: 26
  },
  {
    id: 'user-ren',
    displayName: 'Ren',
    avatarUrl: null,
    plan: 'premium',
    homePrefectureId: 40
  }
];

export const mockUserStats: UserStats[] = [
  {
    userId: 'user-naoki',
    points: 12480,
    loginStreakDays: 9
  },
  {
    userId: 'user-aoi',
    points: 3200,
    loginStreakDays: 2
  },
  {
    userId: 'user-ren',
    points: 22100,
    loginStreakDays: 24
  }
];

export const mockUserConsents: UserConsent[] = [
  {
    id: 'consent-1',
    userId: 'user-naoki',
    consentKey: 'terms',
    accepted: true,
    acceptedAt: '2026-04-01T09:00:00.000Z',
    revokedAt: null
  },
  {
    id: 'consent-2',
    userId: 'user-naoki',
    consentKey: 'privacy',
    accepted: true,
    acceptedAt: '2026-04-01T09:00:00.000Z',
    revokedAt: null
  },
  {
    id: 'consent-3',
    userId: 'user-naoki',
    consentKey: 'tourismAnalytics',
    accepted: true,
    acceptedAt: '2026-04-02T09:00:00.000Z',
    revokedAt: null
  }
];

export const mockTrips: Trip[] = [
  {
    id: 'trip-kyoto-2026',
    title: '春の京都 酒蔵めぐり',
    area: '京都・伏見',
    startsAt: '2026-04-10T00:00:00.000Z',
    endsAt: '2026-04-12T00:00:00.000Z',
    ownerId: 'user-aoi',
    coverPhotoId: 'photo-1',
    memberIds: ['user-naoki', 'user-aoi', 'user-ren'],
    description: '伏見の水と桜を追いかける週末旅。'
  },
  {
    id: 'trip-kanazawa-2026',
    title: '金沢 工芸と市場',
    area: '石川・金沢',
    startsAt: '2026-05-02T00:00:00.000Z',
    endsAt: '2026-05-05T00:00:00.000Z',
    ownerId: 'user-naoki',
    coverPhotoId: 'photo-3',
    memberIds: ['user-naoki', 'user-ren'],
    description: '朝市、茶屋街、うつわ探し。'
  },
  {
    id: 'trip-okinawa-2026',
    title: '沖縄 海辺の記憶',
    area: '沖縄・読谷',
    startsAt: '2026-07-18T00:00:00.000Z',
    endsAt: '2026-07-21T00:00:00.000Z',
    ownerId: 'user-ren',
    coverPhotoId: 'photo-4',
    memberIds: ['user-ren', 'user-naoki'],
    description: '現在ユーザーはviewerのため、写真追加UIが出ない確認用の旅。'
  }
];

export const mockTripMembers: TripMember[] = [
  {
    id: 'member-1',
    tripId: 'trip-kyoto-2026',
    userId: 'user-aoi',
    role: 'owner',
    joinedAt: '2026-03-01T09:00:00.000Z'
  },
  {
    id: 'member-2',
    tripId: 'trip-kyoto-2026',
    userId: 'user-naoki',
    role: 'editor',
    joinedAt: '2026-03-02T09:00:00.000Z'
  },
  {
    id: 'member-3',
    tripId: 'trip-kyoto-2026',
    userId: 'user-ren',
    role: 'viewer',
    joinedAt: '2026-03-03T09:00:00.000Z'
  },
  {
    id: 'member-4',
    tripId: 'trip-kanazawa-2026',
    userId: 'user-naoki',
    role: 'owner',
    joinedAt: '2026-04-12T09:00:00.000Z'
  },
  {
    id: 'member-5',
    tripId: 'trip-kanazawa-2026',
    userId: 'user-ren',
    role: 'editor',
    joinedAt: '2026-04-13T09:00:00.000Z'
  },
  {
    id: 'member-6',
    tripId: 'trip-okinawa-2026',
    userId: 'user-ren',
    role: 'owner',
    joinedAt: '2026-06-20T09:00:00.000Z'
  },
  {
    id: 'member-7',
    tripId: 'trip-okinawa-2026',
    userId: 'user-naoki',
    role: 'viewer',
    joinedAt: '2026-06-21T09:00:00.000Z'
  }
];

export const mockPhotos: Photo[] = [
  {
    id: 'photo-1',
    tripId: 'trip-kyoto-2026',
    uploadedBy: 'user-aoi',
    storagePath: 'mock/kyoto-fushimi.jpg',
    thumbnailPath: 'mock/thumbs/kyoto-fushimi.jpg',
    mockImageIndex: 0,
    lat: 34.9324,
    lng: 135.7616,
    placeName: '伏見稲荷大社',
    prefectureId: 26,
    confidence: 0.94,
    aiTags: ['鳥居', '朝散歩', '京都'],
    capturedAt: '2026-04-10T22:30:00.000Z',
    suggestedThemes: [
      { theme: '神社仏閣', projectId: null, confidence: 92, label: '⛩️ 神社仏閣' },
      { theme: '絶景', projectId: 'conquest-view', confidence: 76, label: '🗻 絶景' }
    ],
    aiProcessingStatus: 'completed',
    themeEntryCreated: false,
    caption: '早朝の鳥居はまだ静かで、足音だけが響いていた。',
    ts: '2026-04-10T22:30:00.000Z',
    reactions: [
      {
        id: 'reaction-1',
        photoId: 'photo-1',
        userId: 'user-naoki',
        reactionType: 'heart',
        createdAt: '2026-04-10T23:00:00.000Z'
      },
      {
        id: 'reaction-2',
        photoId: 'photo-1',
        userId: 'user-ren',
        reactionType: 'seen',
        createdAt: '2026-04-10T23:05:00.000Z'
      }
    ],
    comments: [
      {
        id: 'comment-1',
        photoId: 'photo-1',
        userId: 'user-naoki',
        text: 'この時間に行けたの最高だったね。',
        createdAt: '2026-04-10T23:10:00.000Z'
      }
    ],
    seenBy: ['user-naoki', 'user-ren']
  },
  {
    id: 'photo-2',
    tripId: 'trip-kyoto-2026',
    uploadedBy: 'user-naoki',
    storagePath: 'mock/fushimi-sake.jpg',
    thumbnailPath: 'mock/thumbs/fushimi-sake.jpg',
    mockImageIndex: 1,
    lat: 34.932,
    lng: 135.758,
    placeName: '伏見 酒蔵通り',
    prefectureId: 26,
    confidence: 0.9,
    aiTags: ['酒蔵', '日本酒', '伏見'],
    capturedAt: '2026-04-11T05:20:00.000Z',
    suggestedThemes: [
      { theme: '地酒', projectId: 'conquest-sake', confidence: 95, label: '🍶 地酒' },
      { theme: '神社仏閣', projectId: null, confidence: 41, label: '⛩️ 神社仏閣' }
    ],
    aiProcessingStatus: 'completed',
    themeEntryCreated: true,
    caption: '仕込み水の飲み比べで、旅の記憶が一気に濃くなる。',
    ts: '2026-04-11T05:20:00.000Z',
    reactions: [
      {
        id: 'reaction-3',
        photoId: 'photo-2',
        userId: 'user-aoi',
        reactionType: 'wow',
        createdAt: '2026-04-11T05:40:00.000Z'
      }
    ],
    comments: [
      {
        id: 'comment-2',
        photoId: 'photo-2',
        userId: 'user-ren',
        text: '次は試飲予約して行きたい。',
        createdAt: '2026-04-11T06:00:00.000Z'
      }
    ],
    seenBy: ['user-aoi']
  },
  {
    id: 'photo-3',
    tripId: 'trip-kanazawa-2026',
    uploadedBy: 'user-naoki',
    storagePath: 'mock/kanazawa-market.jpg',
    thumbnailPath: 'mock/thumbs/kanazawa-market.jpg',
    mockImageIndex: 2,
    lat: 36.5708,
    lng: 136.6566,
    placeName: '近江町市場',
    prefectureId: 17,
    confidence: 0.88,
    aiTags: ['市場', '海鮮', '金沢'],
    capturedAt: '2026-05-03T00:15:00.000Z',
    suggestedThemes: [
      { theme: '絶景', projectId: 'conquest-view', confidence: 68, label: '🗻 絶景' },
      { theme: 'カフェ', projectId: 'conquest-cafe', confidence: 42, label: '☕ カフェ' }
    ],
    aiProcessingStatus: 'completed',
    themeEntryCreated: true,
    caption: '朝の市場は判断力を奪う。全部おいしそう。',
    ts: '2026-05-03T00:15:00.000Z',
    reactions: [
      {
        id: 'reaction-4',
        photoId: 'photo-3',
        userId: 'user-ren',
        reactionType: 'like',
        createdAt: '2026-05-03T00:40:00.000Z'
      }
    ],
    comments: [],
    seenBy: ['user-ren']
  },
  {
    id: 'photo-4',
    tripId: 'trip-okinawa-2026',
    uploadedBy: 'user-ren',
    storagePath: 'mock/okinawa-coast.jpg',
    thumbnailPath: 'mock/thumbs/okinawa-coast.jpg',
    mockImageIndex: 3,
    lat: 26.3961,
    lng: 127.7447,
    placeName: '読谷村 海岸線',
    prefectureId: 47,
    confidence: 0.86,
    aiTags: ['海', '夕景', '沖縄'],
    capturedAt: '2026-07-18T09:25:00.000Z',
    suggestedThemes: [
      { theme: '絶景', projectId: 'conquest-view', confidence: 91, label: '🗻 絶景' },
      { theme: 'ペット旅', projectId: null, confidence: 39, label: '🐶 ペット旅' }
    ],
    aiProcessingStatus: 'completed',
    themeEntryCreated: true,
    caption: '夕方の海沿いを歩いた記録。viewer権限の表示確認にも使う。',
    ts: '2026-07-18T09:25:00.000Z',
    reactions: [
      {
        id: 'reaction-5',
        photoId: 'photo-4',
        userId: 'user-naoki',
        reactionType: 'seen',
        createdAt: '2026-07-18T10:00:00.000Z'
      }
    ],
    comments: [
      {
        id: 'comment-3',
        photoId: 'photo-4',
        userId: 'user-naoki',
        text: '次はここも一緒に歩きたい。',
        createdAt: '2026-07-18T10:12:00.000Z'
      }
    ],
    seenBy: ['user-naoki']
  }
];

export const mockConquestEntries: ConquestEntry[] = [
  {
    id: 'entry-sake-kyoto',
    projectId: 'conquest-sake',
    userId: 'user-naoki',
    tripId: 'trip-kyoto-2026',
    photoId: 'photo-2',
    prefectureId: 26,
    title: '伏見の仕込み水と地酒',
    memo: '香りが軽く、旅先の昼にちょうどよい。',
    rating: 5,
    visitedAt: '2026-04-11T06:30:00.000Z',
    placeName: '伏見 酒蔵通り',
    lat: 34.932,
    lng: 135.758,
    source: 'photo_suggestion',
    metadata: { confidence: 95 }
  },
  {
    id: 'entry-cafe-kanazawa',
    projectId: 'conquest-cafe',
    userId: 'user-naoki',
    tripId: 'trip-kanazawa-2026',
    photoId: 'photo-3',
    prefectureId: 17,
    title: '市場帰りの一杯',
    memo: '朝の市場後に休憩。次は周辺カフェも制覇したい。',
    rating: 4,
    visitedAt: '2026-05-03T01:30:00.000Z',
    placeName: '近江町市場周辺',
    lat: 36.5708,
    lng: 136.6566,
    source: 'manual',
    metadata: {}
  },
  {
    id: 'entry-view-okinawa',
    projectId: 'conquest-view',
    userId: 'user-ren',
    tripId: 'trip-okinawa-2026',
    photoId: 'photo-4',
    prefectureId: 47,
    title: '読谷村の夕景',
    memo: '海岸線の夕方。viewer権限確認用にも使う。',
    rating: 5,
    visitedAt: '2026-07-18T09:25:00.000Z',
    placeName: '読谷村 海岸線',
    lat: 26.3961,
    lng: 127.7447,
    source: 'ai_auto',
    metadata: { confidence: 91 }
  }
];

export const mockConquestProjects: ConquestProject[] = [
  {
    id: 'conquest-sake',
    userId: 'user-naoki',
    name: '全国地酒ログ',
    emoji: '🍶',
    color: '#0f8b8d',
    description: '旅先で出会った地酒と酒蔵を都道府県ごとに記録する。',
    category: 'drink',
    isPublic: true,
    entries: mockConquestEntries.filter((entry) => entry.projectId === 'conquest-sake')
  },
  {
    id: 'conquest-cafe',
    userId: 'user-naoki',
    name: '旅先カフェ巡り',
    emoji: '☕',
    color: '#8a4fff',
    description: '市場、駅前、路地裏で見つけた休憩地点の記録。',
    category: 'food',
    isPublic: false,
    entries: mockConquestEntries.filter((entry) => entry.projectId === 'conquest-cafe')
  },
  {
    id: 'conquest-view',
    userId: 'user-naoki',
    name: '絶景コレクション',
    emoji: '🗻',
    color: '#e7b547',
    description: '写真から見つけた絶景スポットを積み上げる。',
    category: 'nature',
    isPublic: true,
    entries: mockConquestEntries.filter((entry) => entry.projectId === 'conquest-view')
  }
];

export const mockTourismEvents: TourismEvent[] = [
  {
    id: 'event-1',
    userId: 'user-naoki',
    tripId: 'trip-kyoto-2026',
    eventType: 'photo_uploaded',
    createdAt: '2026-04-11T05:20:00.000Z'
  }
];

export const mockPhotoFeedItems: PhotoFeedItem[] = mockPhotos.map((photo) => {
  const trip = mockTrips.find((item) => item.id === photo.tripId);
  const uploader = mockUsers.find((user) => user.id === photo.uploadedBy);
  const viewerRole = getTripRole(photo.tripId, mockCurrentUserId, mockTripMembers);

  if (!trip || !uploader || !viewerRole) {
    throw new Error(`Invalid mock photo feed item: ${photo.id}`);
  }

  return {
    photo,
    trip,
    uploader,
    viewerRole
  };
});
