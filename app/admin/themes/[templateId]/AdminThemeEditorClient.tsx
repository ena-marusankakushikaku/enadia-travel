'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ThemeStatusBadge } from '@/components/admin/ThemeStatusBadge';
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from '@/components/admin/AdminForm';
import { EmojiPicker } from '@/components/admin/EmojiPicker';
import { DateTimeField } from '@/components/admin/DateTimeField';
import type { Sponsor, ThemeSpot, ThemeStatus, ThemeTemplate } from '@/types/app';

type Props = {
  template: ThemeTemplate;
  spots: ThemeSpot[];
  sponsors: Sponsor[];
  participantCount: number;
  defaultRadiusM: number;
};

/** datetime-local の入力欄はローカル時刻の "YYYY-MM-DDTHH:mm" しか受け付けない */
function toLocalInputValue(iso: string | null): string {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AdminThemeEditorClient({
  defaultRadiusM,
  participantCount,
  sponsors,
  spots,
  template
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: template.title,
    emoji: template.emoji,
    description: template.description ?? '',
    sponsorId: template.sponsorId ?? '',
    areaLabel: template.areaLabel ?? '',
    rewardText: template.rewardText ?? '',
    termsUrl: template.termsUrl ?? '',
    startsAt: toLocalInputValue(template.startsAt),
    endsAt: toLocalInputValue(template.endsAt)
  });

  const [spot, setSpot] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    radiusM: String(defaultRadiusM),
    description: ''
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(extra: Record<string, unknown> = {}) {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/theme-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          emoji: form.emoji,
          description: form.description || null,
          sponsorId: form.sponsorId || null,
          areaLabel: form.areaLabel || null,
          rewardText: form.rewardText || null,
          termsUrl: form.termsUrl || null,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
          ...extra
        })
      });

      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(json.error ?? '保存できませんでした');
        return;
      }

      setMessage('保存しました');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(status: ThemeStatus) {
    await save({ status });
  }

  async function addSpot() {
    const lat = Number(spot.lat);
    const lng = Number(spot.lng);

    if (!spot.name.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError('スポット名と緯度・経度を入力してください');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/theme-spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          name: spot.name,
          address: spot.address || null,
          description: spot.description || null,
          lat,
          lng,
          radiusM: Number(spot.radiusM) || defaultRadiusM
        })
      });

      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(json.error ?? 'スポットを追加できませんでした');
        return;
      }

      setSpot({ name: '', address: '', lat: '', lng: '', radiusM: String(defaultRadiusM), description: '' });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function removeSpot(spotId: string) {
    setError(null);
    const res = await fetch(`/api/admin/theme-spots/${spotId}`, { method: 'DELETE' });
    const json = (await res.json()) as { error?: string };

    if (!res.ok) {
      setError(json.error ?? '削除できませんでした');
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link className="text-sm text-enadia-primary" href="/admin/themes">
            ← 一覧
          </Link>
          <h2 className="text-base font-bold text-enadia-ink">
            {template.emoji} {template.title}
          </h2>
          <ThemeStatusBadge status={template.status} />
          {template.isSponsored ? (
            <span className="rounded bg-enadia-accent px-1.5 py-0.5 text-[10px] font-bold text-white">PR</span>
          ) : null}
        </div>
        <div className="flex gap-2">
          {template.status !== 'published' ? (
            <Button loading={saving} onClick={() => changeStatus('published')}>
              公開する
            </Button>
          ) : (
            <Button loading={saving} onClick={() => changeStatus('closed')} variant="secondary">
              掲載を終了する
            </Button>
          )}
        </div>
      </div>

      {error ? <p className="rounded bg-red-50 p-3 text-sm text-enadia-danger">{error}</p> : null}
      {message ? <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

      {participantCount > 0 ? (
        <p className="rounded-lg border border-enadia-line bg-white p-3 text-sm text-enadia-muted">
          このテーマにはすでに <b className="text-enadia-ink">{participantCount}人</b> が参加しています。
          スポットの削除や期間の短縮は、参加している人の進み具合に影響します。
        </p>
      ) : null}

      <section className="space-y-4 rounded-lg border border-enadia-line bg-white p-4">
        <h3 className="text-sm font-bold text-enadia-ink">基本情報</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="テーマ名" required>
            <AdminInput onChange={(event) => update('title', event.target.value)} value={form.title} />
          </AdminField>
          <AdminField label="絵文字">
            <EmojiPicker onChange={(next) => update('emoji', next)} value={form.emoji} />
          </AdminField>
          <AdminField hint="選ぶと PR バッジが自動で付き、外せなくなります" label="提供元">
            <AdminSelect onChange={(event) => update('sponsorId', event.target.value)} value={form.sponsorId}>
              <option value="">なし（運営の公式テーマ）</option>
              {sponsors.map((sponsor) => (
                <option key={sponsor.id} value={sponsor.id}>
                  {sponsor.displayName}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField hint="例：富山県 / 北陸" label="エリア表示">
            <AdminInput onChange={(event) => update('areaLabel', event.target.value)} value={form.areaLabel} />
          </AdminField>
          <AdminField hint="日付を選ぶと時刻は 00:00 が入ります" label="開始日時">
            <DateTimeField
              defaultTime="00:00"
              onChange={(next) => update('startsAt', next)}
              value={form.startsAt}
            />
          </AdminField>
          <AdminField hint="日付を選ぶと時刻は 23:59 が入ります" label="終了日時">
            <DateTimeField
              defaultTime="23:59"
              onChange={(next) => update('endsAt', next)}
              value={form.endsAt}
            />
          </AdminField>
        </div>

        <AdminField label="説明">
          <AdminTextarea onChange={(event) => update('description', event.target.value)} rows={3} value={form.description} />
        </AdminField>

        <AdminField hint="特典の提供・条件・在庫は提供元の責任である旨を、アプリ側でも表示します" label="達成特典">
          <AdminTextarea onChange={(event) => update('rewardText', event.target.value)} rows={2} value={form.rewardText} />
        </AdminField>

        <AdminField hint="提供元の応募規約ページなど" label="提供元の規約URL">
          <AdminInput
            onChange={(event) => update('termsUrl', event.target.value)}
            placeholder="https://"
            value={form.termsUrl}
          />
        </AdminField>

        <Button loading={saving} onClick={() => save()}>
          保存
        </Button>
      </section>

      {template.kind === 'spot' ? (
        <section className="space-y-4 rounded-lg border border-enadia-line bg-white p-4">
          <div>
            <h3 className="text-sm font-bold text-enadia-ink">まわるスポット（{spots.length}件）</h3>
            <p className="mt-1 text-xs text-enadia-muted">
              半径は到達判定に使います。温泉街や商店街のように「面」で回る場所は広め（400〜600m）、
              駅前など近くに別のスポットがある場所は狭め（150〜200m）にしてください。
            </p>
          </div>

          {spots.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-enadia-muted">
                <tr>
                  <th className="py-1 font-semibold">#</th>
                  <th className="py-1 font-semibold">名前</th>
                  <th className="py-1 font-semibold">座標</th>
                  <th className="py-1 font-semibold">半径</th>
                  <th className="py-1" />
                </tr>
              </thead>
              <tbody>
                {spots.map((item, index) => (
                  <tr className="border-t border-enadia-line" key={item.id}>
                    <td className="py-2 text-enadia-muted">{index + 1}</td>
                    <td className="py-2">
                      <p className="font-semibold text-enadia-ink">{item.name}</p>
                      {item.address ? <p className="text-xs text-enadia-muted">{item.address}</p> : null}
                    </td>
                    <td className="py-2 text-xs text-enadia-muted">
                      {item.lat.toFixed(5)}, {item.lng.toFixed(5)}
                    </td>
                    <td className="py-2 text-xs text-enadia-muted">{item.radiusM}m</td>
                    <td className="py-2 text-right">
                      <button
                        aria-label={`${item.name} を削除`}
                        className="rounded p-1.5 text-enadia-muted transition hover:bg-red-50 hover:text-enadia-danger"
                        onClick={() => removeSpot(item.id)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="rounded border border-dashed border-enadia-line p-4 text-center text-sm text-enadia-muted">
              スポットがありません。1件以上ないと公開できません。
            </p>
          )}

          <div className="space-y-3 rounded-lg bg-slate-50 p-3">
            <h4 className="text-xs font-bold text-enadia-ink">スポットを追加</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="名前" required>
                <AdminInput
                  onChange={(event) => setSpot((s) => ({ ...s, name: event.target.value }))}
                  placeholder="新湊きっときと市場"
                  value={spot.name}
                />
              </AdminField>
              <AdminField label="住所">
                <AdminInput
                  onChange={(event) => setSpot((s) => ({ ...s, address: event.target.value }))}
                  value={spot.address}
                />
              </AdminField>
              <AdminField hint="Googleマップで場所を右クリックすると座標をコピーできます" label="緯度" required>
                <AdminInput
                  onChange={(event) => setSpot((s) => ({ ...s, lat: event.target.value }))}
                  placeholder="36.7897"
                  value={spot.lat}
                />
              </AdminField>
              <AdminField label="経度" required>
                <AdminInput
                  onChange={(event) => setSpot((s) => ({ ...s, lng: event.target.value }))}
                  placeholder="137.0958"
                  value={spot.lng}
                />
              </AdminField>
              <AdminField hint="50〜5000m" label="到達判定の半径（m）">
                <AdminInput
                  onChange={(event) => setSpot((s) => ({ ...s, radiusM: event.target.value }))}
                  type="number"
                  value={spot.radiusM}
                />
              </AdminField>
            </div>
            <Button loading={saving} onClick={addSpot} size="sm">
              追加
            </Button>
          </div>
        </section>
      ) : (
        <p className="rounded-lg border border-enadia-line bg-white p-4 text-sm text-enadia-muted">
          エリア型のテーマなので、スポットの登録は不要です。47都道府県で進み具合を計算します。
        </p>
      )}
    </div>
  );
}
