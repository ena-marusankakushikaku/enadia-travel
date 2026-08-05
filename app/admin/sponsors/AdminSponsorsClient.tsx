'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { AdminField, AdminInput, AdminTextarea } from '@/components/admin/AdminForm';
import type { Sponsor } from '@/types/app';

export function AdminSponsorsClient({ sponsors }: { sponsors: Sponsor[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    displayName: '',
    contactEmail: '',
    contractStartsOn: '',
    contractEndsOn: '',
    note: ''
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function create() {
    if (!form.name.trim() || !form.displayName.trim()) {
      setError('名称と表示名を入力してください');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(json.error ?? '登録できませんでした');
        return;
      }

      setForm({ name: '', displayName: '', contactEmail: '', contractStartsOn: '', contractEndsOn: '', note: '' });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-enadia-ink">提供元（スポンサー）</h2>
        <p className="mt-1 text-xs text-enadia-muted">
          「表示名」はアプリの画面に「提供：〇〇」として出ます。契約書の正式名称と違う場合は表示名のほうを整えてください。
        </p>
      </div>

      {error ? <p className="rounded bg-red-50 p-3 text-sm text-enadia-danger">{error}</p> : null}

      <section className="space-y-4 rounded-lg border border-enadia-line bg-white p-4">
        <h3 className="text-sm font-bold text-enadia-ink">新しい提供元</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField hint="契約上の正式名称。画面には出しません" label="名称" required>
            <AdminInput onChange={(event) => update('name', event.target.value)} value={form.name} />
          </AdminField>
          <AdminField hint="アプリに「提供：〇〇」と出ます" label="表示名" required>
            <AdminInput
              onChange={(event) => update('displayName', event.target.value)}
              placeholder="富山湾さかな街道推進協議会"
              value={form.displayName}
            />
          </AdminField>
          <AdminField label="連絡先メール">
            <AdminInput
              onChange={(event) => update('contactEmail', event.target.value)}
              type="email"
              value={form.contactEmail}
            />
          </AdminField>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="契約開始">
              <AdminInput
                onChange={(event) => update('contractStartsOn', event.target.value)}
                type="date"
                value={form.contractStartsOn}
              />
            </AdminField>
            <AdminField label="契約終了">
              <AdminInput
                onChange={(event) => update('contractEndsOn', event.target.value)}
                type="date"
                value={form.contractEndsOn}
              />
            </AdminField>
          </div>
        </div>
        <AdminField label="メモ">
          <AdminTextarea onChange={(event) => update('note', event.target.value)} rows={2} value={form.note} />
        </AdminField>
        <Button loading={saving} onClick={create}>
          登録
        </Button>
      </section>

      {sponsors.length === 0 ? (
        <p className="rounded-lg border border-dashed border-enadia-line bg-white p-8 text-center text-sm text-enadia-muted">
          まだ登録がありません。
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-enadia-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-enadia-muted">
              <tr>
                <th className="px-4 py-2 font-semibold">表示名</th>
                <th className="px-4 py-2 font-semibold">名称</th>
                <th className="px-4 py-2 font-semibold">連絡先</th>
                <th className="px-4 py-2 font-semibold">契約期間</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map((sponsor) => (
                <tr className="border-t border-enadia-line" key={sponsor.id}>
                  <td className="px-4 py-3 font-semibold text-enadia-ink">{sponsor.displayName}</td>
                  <td className="px-4 py-3 text-enadia-muted">{sponsor.name}</td>
                  <td className="px-4 py-3 text-xs text-enadia-muted">{sponsor.contactEmail ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-enadia-muted">
                    {sponsor.contractStartsOn ?? '—'} 〜 {sponsor.contractEndsOn ?? '—'}
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
