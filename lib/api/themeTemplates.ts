import type { Database } from '@/types/db';
import type {
  ConquestThemeCategory,
  Sponsor,
  ThemeSpot,
  ThemeTemplate
} from '@/types/app';

type SponsorRow = Database['public']['Tables']['sponsors']['Row'];
type ThemeTemplateRow = Database['public']['Tables']['theme_templates']['Row'];
type ThemeSpotRow = Database['public']['Tables']['theme_spots']['Row'];

export function mapSponsorRow(row: SponsorRow): Sponsor {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    logoUrl: row.logo_url,
    contactEmail: row.contact_email,
    note: row.note,
    contractStartsOn: row.contract_starts_on,
    contractEndsOn: row.contract_ends_on
  };
}

export function mapThemeTemplateRow(row: ThemeTemplateRow): ThemeTemplate {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    emoji: row.emoji,
    color: row.color,
    category: row.category as ConquestThemeCategory,
    kind: row.kind,
    sponsorId: row.sponsor_id,
    isSponsored: row.is_sponsored,
    areaLabel: row.area_label,
    coverImageUrl: row.cover_image_url,
    rewardText: row.reward_text,
    termsUrl: row.terms_url,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at
  };
}

export function mapThemeSpotRow(row: ThemeSpotRow): ThemeSpot {
  return {
    id: row.id,
    templateId: row.template_id,
    name: row.name,
    description: row.description,
    address: row.address,
    prefectureId: row.prefecture_id,
    lat: row.lat,
    lng: row.lng,
    radiusM: row.radius_m,
    orderNo: row.order_no,
    imageUrl: row.image_url,
    externalUrl: row.external_url
  };
}

/**
 * 掲載期間の状態。
 *
 * status（draft/published/closed）は運営が手で切り替えるもので、
 * こちらは日付から自動で決まるもの。両方を見ないと
 * 「公開のままだが期間が終わっている」テーマを正しく扱えない。
 */
export type ThemePeriodState = 'before' | 'open' | 'ended';

export function getThemePeriodState(
  template: Pick<ThemeTemplate, 'startsAt' | 'endsAt'>,
  now: Date = new Date()
): ThemePeriodState {
  if (template.startsAt && now < new Date(template.startsAt)) {
    return 'before';
  }

  if (template.endsAt && now > new Date(template.endsAt)) {
    return 'ended';
  }

  return 'open';
}

/** 掲載終了までの残り日数。期間の指定が無ければ null */
export function getDaysLeft(
  template: Pick<ThemeTemplate, 'endsAt'>,
  now: Date = new Date()
): number | null {
  if (!template.endsAt) {
    return null;
  }

  const diff = new Date(template.endsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}
