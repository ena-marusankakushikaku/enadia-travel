'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { APP_SETTING_RANGES } from '@/lib/settings';
import type { AppSettingKey, AppSettingRow } from '@/types/app';

export function AdminSettingsClient({ settings }: { settings: AppSettingRow[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((row) => [row.key, String(row.value)]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload: Record<string, number> = {};
      for (const [key, value] of Object.entries(values)) {
        payload[key] = Number(value);
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload })
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-enadia-ink">設定</h2>
        <p className="mt-1 text-xs text-enadia-muted">
          変えられるのは<b>数値だけ</b>です。「動画書き出しはProのみ」のような機能のON/OFFは、
          意図的にここに置いていません。管理画面から機能を切れるようにすると、課金の状態と食い違ったときに
          「お金を払っているのに使えない」が起きるうえ、確認すべき組み合わせが一気に増えるためです。
        </p>
      </div>

      {error ? <p className="rounded bg-red-50 p-3 text-sm text-enadia-danger">{error}</p> : null}
      {message ? <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

      <div className="space-y-3">
        {settings.map((row) => {
          const range = APP_SETTING_RANGES[row.key as AppSettingKey];

          return (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-enadia-line bg-white p-4"
              key={row.key}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-enadia-ink">{row.label}</p>
                {row.description ? (
                  <p className="mt-0.5 text-xs text-enadia-muted">{row.description}</p>
                ) : null}
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {row.key} ・ {range.min}〜{range.max}
                </p>
              </div>
              <input
                className="w-28 rounded-lg border border-enadia-line px-3 py-2 text-right text-sm focus:border-enadia-primary focus:outline-none"
                max={range.max}
                min={range.min}
                onChange={(event) => setValues((current) => ({ ...current, [row.key]: event.target.value }))}
                type="number"
                value={values[row.key] ?? ''}
              />
            </div>
          );
        })}
      </div>

      <Button loading={saving} onClick={save}>
        保存
      </Button>

      <p className="rounded-lg border border-enadia-line bg-white p-4 text-xs text-enadia-muted">
        <b className="text-enadia-ink">「レポートに出す最小人数」は5未満にできません。</b>
        利用規約 第13条3項で「集計の対象となる人数が5人未満となる区分は出力しない」と約束しているため、
        実装側でも下限を設けています。
      </p>
    </div>
  );
}
