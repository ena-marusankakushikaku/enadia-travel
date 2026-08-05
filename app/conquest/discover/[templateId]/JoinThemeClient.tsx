'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { SponsorCredit, SponsoredBadge } from '@/components/themes/SponsoredBadge';
import { getDaysLeft, getThemePeriodState } from '@/lib/api/themeTemplates';
import type { Sponsor, ThemeSpot, ThemeTemplate } from '@/types/app';

type Props = {
  template: ThemeTemplate;
  spots: ThemeSpot[];
  sponsor: Sponsor | null;
  joinedProjectId: string | null;
  plan: string;
};

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString('ja-JP') : '—';
}

export function JoinThemeClient({ joinedProjectId, plan, sponsor, spots, template }: Props) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const periodState = getThemePeriodState(template);
  const daysLeft = getDaysLeft(template);

  async function join() {
    setJoining(true);
    setError(null);

    try {
      const res = await fetch('/api/theme-participations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id })
      });

      const json = (await res.json()) as { projectId?: string; error?: string };

      if (!res.ok || !json.projectId) {
        setError(json.error ?? '参加できませんでした');
        return;
      }

      router.push(`/conquest/${json.projectId}`);
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="relative flex h-32 items-end rounded-lg p-4"
        style={{
          background: `linear-gradient(140deg, ${template.color}, ${template.color}99 60%, #ffffff33)`
        }}
      >
        {template.isSponsored ? (
          <div className="absolute left-4 top-4">
            <SponsoredBadge />
          </div>
        ) : null}
        <div>
          <p className="text-lg font-bold text-white drop-shadow">
            {template.emoji} {template.title}
          </p>
          <p className="text-xs text-white/90 drop-shadow">
            {formatDate(template.startsAt)} 〜 {formatDate(template.endsAt)}
            {daysLeft !== null ? `（のこり${daysLeft}日）` : ''}
          </p>
        </div>
      </div>

      {/* ステマ規制対応：広告であることと提供元を、スクロールせずに見える位置に置く */}
      {template.isSponsored && sponsor ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <SponsoredBadge variant="soft" />
            {template.termsUrl ? (
              <a
                className="text-xs font-semibold text-enadia-primary"
                href={template.termsUrl}
                rel="noreferrer noopener"
                target="_blank"
              >
                提供元の応募規約 ›
              </a>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm font-bold text-enadia-ink">提供：{sponsor.displayName}</p>
          <p className="mt-1 text-xs text-enadia-muted">
            このテーマは提供元から費用をいただいて掲載しています。
          </p>
        </div>
      ) : sponsor ? (
        <SponsorCredit displayName={sponsor.displayName} />
      ) : null}

      {template.description ? (
        <div className="rounded-lg border border-enadia-line bg-white p-4">
          <p className="whitespace-pre-wrap text-sm text-enadia-ink">{template.description}</p>
        </div>
      ) : null}

      <div className="rounded-lg border border-enadia-line bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-enadia-ink">テーマ枠</p>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            消費しません
          </span>
        </div>
        <p className="mt-1.5 text-xs text-enadia-muted">
          {plan === 'free'
            ? '無料プランでも、配布されたテーマはいくつでも参加できます（枠を数えるのは自分で作ったテーマだけです）。'
            : 'Proプランのため、自作テーマも配布テーマも無制限です。'}
        </p>
      </div>

      {template.kind === 'spot' ? (
        <div className="rounded-lg border border-enadia-line bg-white p-4">
          <p className="text-sm font-bold text-enadia-ink">まわるスポット（{spots.length}）</p>
          <ul className="mt-2 divide-y divide-dashed divide-enadia-line">
            {spots.map((spot, index) => (
              <li className="flex items-start gap-3 py-2" key={spot.id}>
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-enadia-muted">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-enadia-ink">{spot.name}</p>
                  <p className="text-xs text-enadia-muted">
                    {spot.address ?? '—'} ・ 半径{spot.radiusM}m
                  </p>
                  {spot.description ? (
                    <p className="mt-0.5 text-xs text-enadia-muted">{spot.description}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="rounded-lg border border-enadia-line bg-white p-4 text-sm text-enadia-muted">
          47都道府県をまわるテーマです。訪れた県が地図に色として残ります。
        </p>
      )}

      {template.rewardText ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-800">🎁 達成特典</p>
          <p className="mt-1 whitespace-pre-wrap text-xs text-enadia-ink">{template.rewardText}</p>
          <p className="mt-2 text-xs text-enadia-muted">
            特典は提供元が用意するものです。内容・条件・引換については提供元の定めによります。
          </p>
        </div>
      ) : null}

      {error ? <p className="rounded bg-red-50 p-3 text-sm text-enadia-danger">{error}</p> : null}

      {joinedProjectId ? (
        <Button onClick={() => router.push(`/conquest/${joinedProjectId}`)}>参加中のテーマを開く</Button>
      ) : periodState === 'ended' ? (
        <p className="rounded-lg bg-slate-100 p-3 text-center text-sm text-enadia-muted">
          このテーマは掲載期間が終了しました。
        </p>
      ) : (
        <>
          <Button loading={joining} onClick={join}>
            このテーマに参加する
          </Button>
          <p className="text-center text-xs text-enadia-muted">参加は無料。いつでもやめられます。</p>
        </>
      )}
    </div>
  );
}
