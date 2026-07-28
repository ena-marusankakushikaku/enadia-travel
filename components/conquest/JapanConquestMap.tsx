'use client';

import { JapanMap } from '@/components/map/JapanMap';

type JapanConquestMapProps = {
  /** 色を塗る都道府県 */
  achievedPrefectureIds: number[];
  onSelectPrefecture: (prefectureId: number) => void;
  /** 地図の下に出す説明文 */
  caption?: string;
};

export function JapanConquestMap({ achievedPrefectureIds, caption, onSelectPrefecture }: JapanConquestMapProps) {
  const achievedCount = new Set(achievedPrefectureIds).size;
  const progress = Math.round((achievedCount / 47) * 100);

  return (
    <section className="rounded-lg border border-enadia-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-enadia-ink">日本地図 制覇マップ</h2>
        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-enadia-primary">
          {achievedCount} / 47 県
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-enadia-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-3 overflow-hidden rounded-lg bg-[linear-gradient(160deg,#eef7fb_0%,#f6fbfd_100%)] p-2">
        <JapanMap highlightedPrefectureIds={achievedPrefectureIds} onSelectPrefecture={onSelectPrefecture} />
      </div>

      <p className="mt-2 text-xs text-enadia-muted">{caption ?? '都道府県をタップすると記録を確認できます。'}</p>
    </section>
  );
}
