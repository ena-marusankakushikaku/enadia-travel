import type { MembershipRank, MembershipRankId } from '@/types/app';

/**
 * 会員ランク。
 *
 * ポイントは持たない。写真とテーマ記録から**そのつど計算する**。
 * ポイントを貯める仕組みを作ると、写真を消したときの減算・二重加算の防止・
 * 過去分の遡り計算が全部必要になり、必ずどこかで実際の記録と食い違う。
 * 旅の「何日目」を保存せず計算しているのと同じ考え方。
 *
 * 条件に使う4つ（訪問県数・テーマ記録数・配布テーマ達成数・訪問国数）は、
 * どれもB2Bで価値になる指標。ユーザーが楽しんで増やす行動と、
 * 主催者に返す達成率と、データ事業の中身が同じ方向を向く。
 */
export type RankInput = {
  /** 写真から判明した訪問都道府県の数 */
  prefectureCount: number;
  /** 写真から判明した訪問国の数（日本を含む） */
  countryCount: number;
  /** テーマ記録の件数 */
  entryCount: number;
  /** 配布テーマを最後まで達成した数 */
  completedThemeCount: number;
};

type RankDefinition = {
  id: MembershipRankId;
  name: string;
  emoji: string;
  /** 到達条件。いずれかを満たせばそのランク */
  matches: (input: RankInput) => boolean;
  /** 次のランクを目指す人への一言 */
  hint: (input: RankInput) => string;
  /** 進み具合（0〜1） */
  progress: (input: RankInput) => number;
};

const ratio = (current: number, target: number) =>
  target <= 0 ? 1 : Math.min(1, Math.max(0, current / target));

const RANKS: RankDefinition[] = [
  {
    id: 'start',
    name: '旅のはじまり',
    emoji: '🌱',
    matches: () => true,
    hint: (input) => `あと${Math.max(0, 3 - input.prefectureCount)}県で「かけだし旅人」`,
    progress: (input) => Math.max(ratio(input.prefectureCount, 3), ratio(input.entryCount, 10))
  },
  {
    id: 'novice',
    name: 'かけだし旅人',
    emoji: '🧭',
    matches: (input) => input.prefectureCount >= 3 || input.entryCount >= 10,
    hint: (input) => `あと${Math.max(0, 10 - input.prefectureCount)}県で「旅人」`,
    progress: (input) => Math.max(ratio(input.prefectureCount, 10), ratio(input.entryCount, 50))
  },
  {
    id: 'traveler',
    name: '旅人',
    emoji: '🎒',
    matches: (input) =>
      input.prefectureCount >= 10 || input.entryCount >= 50 || input.completedThemeCount >= 1,
    hint: (input) => `あと${Math.max(0, 20 - input.prefectureCount)}県で「旅マスター」`,
    progress: (input) =>
      Math.max(
        ratio(input.prefectureCount, 20),
        ratio(input.entryCount, 150),
        ratio(input.completedThemeCount, 3)
      )
  },
  {
    id: 'master',
    name: '旅マスター',
    emoji: '🏅',
    matches: (input) =>
      input.prefectureCount >= 20 || input.entryCount >= 150 || input.completedThemeCount >= 3,
    hint: (input) =>
      `30県＋海外3か国で「グローバル探検家」（いま ${input.prefectureCount}県・${Math.max(0, input.countryCount - 1)}か国）`,
    progress: (input) => Math.min(ratio(input.prefectureCount, 30), ratio(input.countryCount, 4))
  },
  {
    id: 'global',
    name: 'グローバル探検家',
    emoji: '🌏',
    // 海外3か国 = 日本を含めると4か国
    matches: (input) => input.prefectureCount >= 30 && input.countryCount >= 4,
    hint: (input) => `あと${Math.max(0, 47 - input.prefectureCount)}県で全国制覇`,
    progress: (input) => ratio(input.prefectureCount, 47)
  },
  {
    id: 'legend',
    name: 'レジェンド旅人',
    emoji: '👑',
    matches: (input) => input.prefectureCount >= 47,
    hint: () => '',
    progress: () => 1
  }
];

export function calcMembershipRank(input: RankInput): MembershipRank {
  // 満たした中でいちばん高いものを採用する
  let current = RANKS[0];

  for (const rank of RANKS) {
    if (rank.matches(input)) {
      current = rank;
    }
  }

  const isTop = current.id === 'legend';

  return {
    id: current.id,
    name: current.name,
    emoji: current.emoji,
    nextHint: isTop ? null : current.hint(input),
    progress: isTop ? 1 : current.progress(input)
  };
}

export const MEMBERSHIP_RANKS = RANKS.map(({ emoji, id, name }) => ({ id, name, emoji }));
