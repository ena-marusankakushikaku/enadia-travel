'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { clsx } from 'clsx';
import { AddConquestEntryModal } from '@/components/conquest/AddConquestEntryModal';
import { JapanConquestMap } from '@/components/conquest/JapanConquestMap';
import { WorldConquestMap } from '@/components/conquest/WorldConquestMap';
import { ThemeEntryCard } from '@/components/trips/ThemeEntryCard';
import { EditThemeEntryModal } from '@/components/trips/EditThemeEntryModal';
import { SponsorCredit, SponsoredBadge } from '@/components/themes/SponsoredBadge';
import {
  collectEntryLocations,
  countAchievedPrefectures,
  PREFECTURE_TOTAL,
  prefectureProgress
} from '@/lib/conquest/progress';
import { calcThemeProgress } from '@/lib/themes/spotProgress';
import { getDaysLeft } from '@/lib/api/themeTemplates';
import type { ConquestProject, Photo, Sponsor, ThemeSpot, ThemeTemplate, UserProfile } from '@/types/app';

type ConquestDetailProps = {
  project: ConquestProject;
  photos: Photo[];
  users: UserProfile[];
  userId: string;
  /** 海外で記録した国の数。日本は含まない。サーバー側で数えて渡す */
  overseasCountryCount: number;
  /** 配布テーマから参加したものだけ入る。自作テーマでは null */
  template?: ThemeTemplate | null;
  spots?: ThemeSpot[];
  sponsor?: Sponsor | null;
};

type MapMode = 'japan' | 'world';

export function ConquestDetail({
  overseasCountryCount,
  photos,
  project,
  sponsor = null,
  spots = [],
  template = null,
  userId,
  users
}: ConquestDetailProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>('japan');

  const entries = project.entries;
  const editingEntry = entries.find((entry) => entry.id === editingEntryId) ?? null;
  const prefectureCount = countAchievedPrefectures(entries);
  const progress = prefectureProgress(entries);
  const achievedPrefectureIds = entries
    .map((entry) => entry.prefectureId)
    .filter((id): id is number => id !== null);

  // スポット型のテーマは、分母が47都道府県ではなく登録されたスポット数になる。
  // 分岐は calcThemeProgress の中だけに置き、画面は返ってきた値を出すだけにしている。
  const isSpotTheme = template?.kind === 'spot';
  const themeProgress = calcThemeProgress(template?.kind ?? 'area', entries, spots);
  const reachedSpotIds = new Set(
    entries.map((entry) => entry.spotId).filter((id): id is string => Boolean(id))
  );
  const daysLeft = template ? getDaysLeft(template) : null;

  async function deleteEntry(entryId: string) {
    if (deletingId) {
      return;
    }

    if (!window.confirm('この記録を削除しますか？')) {
      return;
    }

    setDeletingId(entryId);
    setError(null);

    try {
      const response = await fetch(`/api/conquest-entries/${entryId}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? '削除に失敗しました。');
        return;
      }
      router.refresh();
    } catch {
      setError('通信に失敗しました。時間をおいて試してください。');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-enadia-line bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <p className="text-3xl">{project.emoji}</p>
          {template?.isSponsored ? <SponsoredBadge /> : null}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-enadia-ink">{project.name}</h1>
        {sponsor ? <SponsorCredit className="mt-1" displayName={sponsor.displayName} /> : null}
        {project.description ? (
          <p className="mt-2 text-sm leading-relaxed text-enadia-muted">{project.description}</p>
        ) : null}
        {daysLeft !== null ? (
          <p className="mt-2 text-xs font-semibold text-enadia-primary">
            {daysLeft > 0 ? `のこり${daysLeft}日` : 'このテーマは掲載期間が終了しました'}
          </p>
        ) : null}

        {isSpotTheme ? (
          // スポット型：分母はスポット数。都道府県では数えない
          <>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-2xl font-bold text-enadia-ink">{themeProgress.percent}%</p>
                <p className="text-xs text-enadia-muted">達成率</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-2xl font-bold text-enadia-ink">{themeProgress.achieved}</p>
                <p className="text-xs text-enadia-muted">
                  達成 / {themeProgress.total}
                  {themeProgress.unit}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-2xl font-bold text-enadia-ink">{entries.length}</p>
                <p className="text-xs text-enadia-muted">記録</p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-enadia-primary"
                style={{ width: `${themeProgress.percent}%` }}
              />
            </div>
          </>
        ) : (
          // 日本は「47県のうち何県」、海外は「何か国」。単位が違うので率でまとめず並べる
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-2xl font-bold text-enadia-ink">{progress}%</p>
              <p className="text-xs text-enadia-muted">日本の制覇率</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-2xl font-bold text-enadia-ink">{prefectureCount}</p>
              <p className="text-xs text-enadia-muted">達成 / {PREFECTURE_TOTAL}県</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-2xl font-bold text-enadia-ink">{overseasCountryCount}</p>
              <p className="text-xs text-enadia-muted">海外の国数</p>
            </div>
          </div>
        )}
      </div>

      {isSpotTheme ? (
        <section className="rounded-lg border border-enadia-line bg-white p-4">
          <h2 className="text-sm font-bold text-enadia-ink">まわるスポット（{spots.length}）</h2>
          <ul className="mt-2 divide-y divide-dashed divide-enadia-line">
            {spots.map((item, index) => {
              const reached = reachedSpotIds.has(item.id);

              return (
                <li className="flex items-start gap-3 py-2.5" key={item.id}>
                  <span
                    className={clsx(
                      'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold',
                      reached ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-enadia-muted'
                    )}
                  >
                    {reached ? '✓' : index + 1}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={clsx(
                        'text-sm font-semibold',
                        reached ? 'text-emerald-700' : 'text-enadia-ink'
                      )}
                    >
                      {item.name}
                    </p>
                    <p className="text-xs text-enadia-muted">
                      {item.address ?? '—'} ・ 半径{item.radiusM}m ・ {reached ? '到達済み' : '未到達'}
                    </p>
                  </div>
                  <a
                    className="ml-auto shrink-0 self-center text-xs font-semibold text-enadia-primary"
                    href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    地図で見る
                  </a>
                </li>
              );
            })}
          </ul>
          {themeProgress.isCompleted ? (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-800">
              🎉 全スポット達成おめでとうございます
            </p>
          ) : null}
        </section>
      ) : null}

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-enadia-ink">表示する地図</h2>
          <div className="flex rounded-full border border-enadia-line bg-white p-0.5">
            {([
              { id: 'japan', label: '日本' },
              { id: 'world', label: '海外' }
            ] as { id: MapMode; label: string }[]).map((button) => (
              <button
                className={clsx(
                  'rounded-full px-3 py-1 text-xs font-bold transition',
                  mapMode === button.id ? 'bg-enadia-ink text-white' : 'text-enadia-muted hover:bg-slate-50'
                )}
                key={button.id}
                onClick={() => setMapMode(button.id)}
                type="button"
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>

        {mapMode === 'japan' ? (
          <JapanConquestMap
            achievedPrefectureIds={achievedPrefectureIds}
            caption={`${project.name}の記録がある都道府県を色分けしています。`}
            onSelectPrefecture={() => undefined}
          />
        ) : (
          <WorldConquestMap
            caption={`${project.name}の記録がある国を色分けしています。`}
            locations={collectEntryLocations(entries, photos)}
          />
        )}
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-enadia-ink">記録一覧</h2>
        <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setIsOpen(true)} size="sm">
          追加
        </Button>
      </div>

      {error ? <p className="text-sm text-enadia-danger">{error}</p> : null}

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-enadia-line bg-white p-6 text-center text-sm text-enadia-muted">
          まだ記録がありません。「追加」から、旅先で出会ったものを記録しましょう。
        </p>
      ) : (
        entries.map((entry) => (
          <ThemeEntryCard
            entry={entry}
            key={entry.id}
            onDelete={deleteEntry}
            onEdit={setEditingEntryId}
            photo={photos.find((photo) => photo.id === entry.photoId)}
            project={project}
            user={users.find((user) => user.id === entry.userId) ?? null}
          />
        ))
      )}

      <AddConquestEntryModal
        onClose={() => setIsOpen(false)}
        onSaved={() => router.refresh()}
        open={isOpen}
        photos={photos}
        projectId={project.id}
        userId={userId}
      />

      <EditThemeEntryModal
        entry={editingEntry}
        onClose={() => setEditingEntryId(null)}
        onSaved={() => router.refresh()}
        open={editingEntry !== null}
        project={project}
      />
    </section>
  );
}
