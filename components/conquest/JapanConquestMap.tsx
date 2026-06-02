'use client';

import { MAP_PREFECTURES } from '@/constants/japan';
import type { ConquestEntry } from '@/types/app';

type JapanConquestMapProps = {
  entries: ConquestEntry[];
  onSelectPrefecture: (prefectureId: number) => void;
};

export function JapanConquestMap({ entries, onSelectPrefecture }: JapanConquestMapProps) {
  const achievedIds = new Set(entries.map((entry) => entry.prefectureId));

  return (
    <section className="rounded-lg border border-enadia-line bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold text-enadia-ink">日本地図 制覇マップ</h2>
      <div className="mt-4 grid grid-cols-8 gap-1">
        {MAP_PREFECTURES.map((prefecture) => {
          const achieved = achievedIds.has(prefecture.id);

          return (
            <button
              className={`h-9 rounded-md px-1 text-[10px] font-bold transition ${
                achieved ? 'bg-enadia-primary text-white' : 'bg-slate-100 text-enadia-muted hover:bg-slate-200'
              }`}
              key={prefecture.id}
              onClick={() => onSelectPrefecture(prefecture.id)}
              style={{ gridColumnStart: prefecture.col + 7, gridRowStart: prefecture.row + 1 }}
              type="button"
            >
              {prefecture.name.replace(/[都道府県]/g, '')}
            </button>
          );
        })}
      </div>
    </section>
  );
}
