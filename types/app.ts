import type { LucideIcon } from 'lucide-react';
import type { LegalDocStatus, LegalDocType, SpotVerification, ThemeKind, ThemeStatus } from '@/types/db';

export type { LegalDocStatus, LegalDocType, SpotVerification, ThemeKind, ThemeStatus };

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
  imageUrl?: string | null;
  /** 一覧のグリッド用の小さい画像。古い写真には無いのでその場合は imageUrl を使う */
  thumbnailUrl?: string | null;
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
  /**
   * NULL なら自作テーマ。非NULL なら配布テーマへの参加。
   * 画面側で新規作成直後の仮の値を組み立てることがあるため任意にしてある（DBから読んだものには必ず入る）。
   */
  templateId?: string | null;
  joinedAt?: string | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  entries: ConquestEntry[];
};

export type ConquestEntry = {
  id: string;
  projectId: string;
  userId: string;
  tripId: string | null;
  photoId: string | null;
  /** 日本国内のときだけ入る。海外の記録は lat/lng から国を判定する */
  prefectureId: number | null;
  title: string;
  memo: string | null;
  rating: number | null;
  visitedAt: string;
  placeName?: string | null;
  lat?: number | null;
  lng?: number | null;
  source: ConquestEntrySource;
  /** 配布テーマのスポットに紐づく記録のときだけ入る（DBから読んだものには必ず入る） */
  spotId?: string | null;
  verification?: SpotVerification;
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
  | 'route_completed'
  | 'theme_viewed'
  | 'theme_joined'
  | 'theme_left'
  | 'spot_reached'
  | 'theme_completed';

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


// ---------------------------------------------------------------
// スポンサードテーマ（配布されるテーマ）
// ---------------------------------------------------------------

export type Sponsor = {
  id: string;
  name: string;
  displayName: string;
  logoUrl: string | null;
  contactEmail: string | null;
  note: string | null;
  contractStartsOn: string | null;
  contractEndsOn: string | null;
};

export type ThemeSpot = {
  id: string;
  templateId: string;
  name: string;
  description: string | null;
  address: string | null;
  prefectureId: number | null;
  lat: number;
  lng: number;
  radiusM: number;
  orderNo: number;
  imageUrl: string | null;
  externalUrl: string | null;
};

export type ThemeTemplate = {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  color: string;
  category: ConquestThemeCategory;
  kind: ThemeKind;
  sponsorId: string | null;
  /** true のとき PR バッジを必ず表示する（景品表示法のステマ規制対応） */
  isSponsored: boolean;
  areaLabel: string | null;
  coverImageUrl: string | null;
  rewardText: string | null;
  termsUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  status: ThemeStatus;
  publishedAt: string | null;
  createdAt: string;
};

/** 発見画面・詳細画面で使う、テーマと付随情報をまとめたもの */
export type ThemeTemplateDetail = ThemeTemplate & {
  sponsor: Sponsor | null;
  spots: ThemeSpot[];
  /** ログイン中のユーザーが参加してできた conquest_project の id */
  joinedProjectId: string | null;
};

// ---------------------------------------------------------------
// 規約・設定・会員ランク
// ---------------------------------------------------------------

export type LegalDocument = {
  id: string;
  docType: LegalDocType;
  version: string;
  title: string;
  body: string;
  summary: string | null;
  status: LegalDocStatus;
  requiresReconsent: boolean;
  publishedAt: string | null;
  effectiveOn: string | null;
  updatedAt: string;
};

export type AppSettingKey =
  | 'free_theme_limit'
  | 'free_theme_unlimited_days'
  | 'free_taste_insight_months'
  | 'free_taste_insight_top_n'
  | 'free_export_per_month'
  | 'spot_default_radius_m'
  | 'report_min_group_size';

export type AppSettings = Record<AppSettingKey, number>;

export type AppSettingRow = {
  key: AppSettingKey;
  value: number;
  label: string;
  description: string | null;
  updatedAt: string;
};

export type MembershipRankId =
  | 'start'
  | 'novice'
  | 'traveler'
  | 'master'
  | 'global'
  | 'legend';

export type MembershipRank = {
  id: MembershipRankId;
  name: string;
  emoji: string;
  /** 次のランクに届くまでの説明。最上位なら null */
  nextHint: string | null;
  /** 次のランクまでの進み具合（0〜1）。最上位なら 1 */
  progress: number;
};
