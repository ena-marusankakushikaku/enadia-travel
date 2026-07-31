import type { Photo } from '@/types/app';

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** お気に入りは、いいね何件分として扱うか */
const FAVORITE_WEIGHT = 3;

function getTime(photo: Photo): number {
  const parsed = new Date(photo.capturedAt ?? photo.ts);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function toDayNumber(photo: Photo): number {
  return Math.floor((getTime(photo) + JST_OFFSET_MS) / DAY_MS);
}

function scorePhoto(photo: Photo, currentUserId: string): number {
  const likes = photo.reactions.filter((reaction) => reaction.reactionType === 'like').length;
  const isFavorite = photo.reactions.some(
    (reaction) => reaction.reactionType === 'heart' && reaction.userId === currentUserId
  );

  return likes + (isFavorite ? FAVORITE_WEIGHT : 0);
}

/**
 * スライドショー用に写真を選ぶ。
 *
 * 全部流すと冗長なので、お気に入り・いいねが多いものを優先しつつ、
 * 特定の日に偏らないよう日ごとに順番に拾っていく。
 * 最後は撮影順に並べ替えて、旅の流れが分かるようにする。
 */
export function buildTripDigest(photos: Photo[], currentUserId: string, max = 10): Photo[] {
  if (photos.length <= max) {
    return [...photos].sort((a, b) => getTime(a) - getTime(b));
  }

  // 日ごとにまとめ、それぞれ評価の高い順に並べる
  const byDay = new Map<number, Photo[]>();
  for (const photo of photos) {
    const day = toDayNumber(photo);
    const group = byDay.get(day) ?? [];
    group.push(photo);
    byDay.set(day, group);
  }

  const days = Array.from(byDay.keys()).sort((a, b) => a - b);
  for (const day of days) {
    const group = byDay.get(day);
    if (group) {
      group.sort((a, b) => scorePhoto(b, currentUserId) - scorePhoto(a, currentUserId) || getTime(a) - getTime(b));
    }
  }

  // 日をまたいで1枚ずつ拾い、偏りを防ぐ
  const picked: Photo[] = [];
  let round = 0;
  while (picked.length < max) {
    let addedInRound = false;

    for (const day of days) {
      const group = byDay.get(day);
      const candidate = group?.[round];
      if (candidate) {
        picked.push(candidate);
        addedInRound = true;
        if (picked.length >= max) {
          break;
        }
      }
    }

    if (!addedInRound) {
      break;
    }
    round += 1;
  }

  return picked.sort((a, b) => getTime(a) - getTime(b));
}
