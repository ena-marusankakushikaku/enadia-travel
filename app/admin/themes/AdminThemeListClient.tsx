'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { ThemeStatusBadge } from '@/components/admin/ThemeStatusBadge';
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from '@/components/admin/AdminForm';
import { EmojiPicker } from '@/components/admin/EmojiPicker';
import { DateTimeField } from '@/components/admin/DateTimeField';
import type { Sponsor, ThemeKind, ThemeTemplate } from '@/types/app';

type Props = {
  templates: ThemeTemplate[];
  sponsors: Sponsor[];
  spotCountByTemplate: Record<string, number>;
};

export function AdminThemeListClient({ sponsors, spotCountByTemplate, templates }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📍');
  const [kind, setKind] = useState<ThemeKind>('spot');
  const [sponsorId, setSponsorId] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  async function handleCreate() {
    if (!title.trim()) {
      setError('テーマ名を入力してください');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/theme-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          emoji,
          kind,
          description: description || null,
          sponsorId: sponsorId || null,
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          endsAt: endsAt ? new Date(endsAt).toISOString() : null
        })
      });

      const json = (await res.json()) as { template?: { id: string }; error?: string };

      if (!res.ok || !json.template) {
        setError(json.error ?? '作成できませんでした');
        return;
      }

      router.push(`/admin/themes/${json.template.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-enadia-ink">テーマ入稿</h2>
          <p className="mt-1 text-xs text-enadia-muted">
            作成したテーマは「下書き」から始まります。スポットを登録してから公開してください。
          </p>
        </div>
        <Button onClick={() => setCreating((value) => !value)} variant={creating ? 'secondary' : 'primary'}>
          {creating ? '閉じる' : '新しいテーマ'}
        </Button>
      </div>

      {creating ? (
        <div className="space-y-4 rounded-lg border border-enadia-line bg-white p-4">
          {error ? <p className="rounded bg-red-50 p-2 text-sm text-enadia-danger">{error}</p> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="テーマ名" required>
              <AdminInput
                onChange={(event) => setTitle(event.target.value)}
                placeholder="越中・富山湾 きときと海鮮めぐり"
                value={title}
              />
            </AdminField>
            <AdminField label="絵文字">
              <EmojiPicker onChange={setEmoji} value={emoji} />
            </AdminField>
            <AdminField
              hint="spot＝指定した地点をまわる（スポンサード向け）／area＝47都道府県を制覇する"
              label="種別"
            >
              <AdminSelect onChange={(event) => setKind(event.target.value as ThemeKind)} value={kind}>
                <option value="spot">スポット型（地点をまわる）</option>
                <option value="area">エリア型（都道府県を制覇）</option>
              </AdminSelect>
            </AdminField>
            <AdminField hint="選ぶと PR バッジが自動で付きます" label="提供元">
              <AdminSelect onChange={(event) => setSponsorId(event.target.value)} value={sponsorId}>
                <option value="">なし（運営の公式テーマ）</option>
                {sponsors.map((sponsor) => (
                  <option key={sponsor.id} value={sponsor.id}>
                    {sponsor.displayName}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField hint="日付を選ぶと時刻は 00:00 が入ります" label="開始日時">
              <DateTimeField defaultTime="00:00" onChange={setStartsAt} value={startsAt} />
            </AdminField>
            <AdminField hint="日付を選ぶと時刻は 23:59 が入ります" label="終了日時">
              <DateTimeField defaultTime="23:59" onChange={setEndsAt} value={endsAt} />
            </AdminField>
          </div>

          <AdminField label="説明">
            <AdminTextarea
              onChange={(event) => setDescription(event.target.value)}
              placeholder="氷見・新湊・岩瀬——湾ぞいの市場や食堂を回って、写真を1枚残すだけ。"
              rows={3}
              value={description}
            />
          </AdminField>

          <Button loading={saving} onClick={handleCreate}>
            下書きを作成
          </Button>
        </div>
      ) : null}

      {templates.length === 0 ? (
        <p className="rounded-lg border border-dashed border-enadia-line bg-white p-8 text-center text-sm text-enadia-muted">
          まだテーマがありません。
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-enadia-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-enadia-muted">
              <tr>
                <th className="px-4 py-2 font-semibold">テーマ</th>
                <th className="px-4 py-2 font-semibold">状態</th>
                <th className="px-4 py-2 font-semibold">スポット</th>
                <th className="px-4 py-2 font-semibold">期間</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr className="border-t border-enadia-line" key={template.id}>
                  <td className="px-4 py-3">
                    <Link
                      className="font-semibold text-enadia-ink hover:text-enadia-primary"
                      href={`/admin/themes/${template.id}`}
                    >
                      {template.emoji} {template.title}
                    </Link>
                    {template.isSponsored ? (
                      <span className="ml-2 rounded bg-enadia-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                        PR
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <ThemeStatusBadge status={template.status} />
                  </td>
                  <td className="px-4 py-3 text-enadia-muted">
                    {template.kind === 'spot' ? `${spotCountByTemplate[template.id] ?? 0}件` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-enadia-muted">
                    {template.startsAt ? new Date(template.startsAt).toLocaleDateString('ja-JP') : '—'}
                    {' 〜 '}
                    {template.endsAt ? new Date(template.endsAt).toLocaleDateString('ja-JP') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
