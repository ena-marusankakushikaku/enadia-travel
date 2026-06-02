import type { LucideIcon } from 'lucide-react';

export type Plan = 'free' | 'pro' | 'premium' | 'admin';
export type TripRole = 'owner' | 'editor' | 'viewer';

export type UserConsentKey =
  | 'terms'
  | 'privacy'
  | 'tourismAnalytics'
  | 'locationHistory';

export type ConsentType =
  | 'photo_storage'
  | 'location_storage'
  | 'ai_analysis'
  | 'commercial_analysis'
  | 'theme_data_analysis'
  | 'marketing'
  | 'third_party_report';

export type UserProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  plan: Plan;
  homePrefectureId: number | null;
};

export type UserStats = {
  userId: string;
  points: number;
  loginStreakDays: number;
};

export type UserConsent = {
  id: string;
  userId: string;
  consentKey: UserConsentKey | ConsentType;
  accepted: boolean;
  acceptedAt: string | null;
  revokedAt: string | null;
};

export type TripMember = {
  id: string;
  tripId: string;
  userId: string;
  role: TripRole;
  joinedAt: string;
};

export type Trip = {
  id: string;
  title: string;
  area: string;
  startsAt: string;
  endsAt: string;
  ownerId: string;
  coverPhotoId: string | null;
  memberIds: string[];
  description: string | null;
};

export type PhotoReaction = {
  id: string;
  photoId: string;
  userId: string;
  reactionType: 'like' | 'heart' | 'wow' | 'seen';
  createdAt: string;
};

export type PhotoComment = {
  id: string;
  photoId: string;
  userId: string;
  text: string;
  createdAt: string;
};

export type Photo = {
  id: string;
  tripId: string;
  uploadedBy: string;
  storagePath: string;
  thumbnailPath?: string | null;
  mockImageIndex?: number;
  lat: number | null;
  lng: number | null;
  placeName: string | null;
  prefectureId: number | null;
  confidence: number | null;
  aiTags: string[];
  caption: string | null;
  ts: string;
  capturedAt: string | null;
  suggestedThemes: SuggestedTheme[];
  aiProcessingStatus: AiProcessingStatus;
  themeEntryCreated: boolean;
  reactions: PhotoReaction[];
  comments: PhotoComment[];
  seenBy: string[];
};

export type ConquestThemeCategory =
  | 'food'
  | 'drink'
  | 'nature'
  | 'culture'
  | 'activity'
  | 'custom';

export type SuggestedTheme = {
  theme: string;
  projectId: string | null;
  confidence: number;
  label: string;
};

export type AiProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'skipped';

export type ConquestEntrySource = 'manual' | 'photo_suggestion' | 'ai_auto';

export type ConquestProject = {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  category: ConquestThemeCategory;
  isPublic: boolean;
  entries: ConquestEntry[];
};

export type ConquestEntry = {
  id: string;
  projectId: string;
  userId: string;
  tripId: string | null;
  photoId: string | null;
  prefectureId: number;
  title: string;
  memo: string | null;
  rating: number | null;
  visitedAt: string;
  placeName?: string | null;
  lat?: number | null;
  lng?: number | null;
  source: ConquestEntrySource;
  metadata: Record<string, unknown>;
};

export type TourismEventType =
  | 'trip_created'
  | 'photo_uploaded'
  | 'place_visit_detected'
  | 'theme_entry_created'
  | 'prefecture_conquered'
  | 'ai_analysis_completed'
  | 'trip_member_joined'
  | 'travel_log_viewed'
  | 'photo_commented'
  | 'conquest_project_created'
  | 'route_completed';

export type TourismEvent = {
  id: string;
  userId: string;
  tripId: string | null;
  eventType: TourismEventType;
  createdAt: string;
};

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isPrimary?: boolean;
};

export type PhotoFeedItem = {
  photo: Photo;
  trip: Trip;
  uploader: UserProfile;
  viewerRole: TripRole;
};
