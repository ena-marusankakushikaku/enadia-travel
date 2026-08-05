'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { LegalStatusBadge } from '@/components/admin/ThemeStatusBadge';
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from '@/components/admin/AdminForm';
import { LEGAL_DOC_LABELS } from '@/lib/legal';
import type { LegalDocType, LegalDocument } from '@/types/app';

type Props = { documents: LegalDocument[] };

export function AdminLegalClient({ documents }: Props) {
  const router = useRouter();
  const [docType, setDocType] = useState<LegalDocType>('terms');
  const [selectedId, setSelectedId] = useState<string | null>(documents[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [draft, setDraft] = useState({ version: '', title: '', bodyText: '', effectiveOn: '', requiresReconsent: false });
  const [editing, setEditing] = useState<{ title: string; bodyText: string } | null>(null);

  const filtered = useMemo(
    () => documents.filter((doc) => doc.docType === docType),
    [docType, documents]
  );

  const selected = useMemo(
    () => filtered.find((doc) => doc.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId]
  );

  async function call(url: string, init: RequestInit) {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(url, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) }
      });
      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(json.error ?? '処理できませんでした');
        return false;
      }

      router.refresh();
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function createVersion() {
    if (!draft.version.trim() || !draft.title.trim()) {
      setError('バージョンとタイトルを入力してください');
      return;
    }

    const ok = await call('/api/admin/legal-documents', {
      method: 'POST',
      body: JSON.stringify({
        docType,
        version: draft.version,
        title: draft.title,
        bodyText: draft.bodyText,
        effectiveOn: draft.effectiveOn || null,
        requiresReconsent: draft.requiresReconsent,
        copyFromId: draft.bodyText ? undefined : selected?.id
      })
    });

    if (ok) {
      setDraft({ version: '', title: '', bodyText: '', effectiveOn: '', requiresReconsent: false });
      setMessage('下書きを作成しました');
    }
  }

  async function saveBody() {
    if (!selected || !editing) return;

    const ok = await call(`/api/admin/legal-documents/${selected.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: editing.title, bodyText: editing.bodyText })
    });

    if (ok) {
      setEditing(null);
      setMessage('保存しました');
    }
  }

  async function publish() {
    if (!selected) return;

    const ok = await call(`/api/admin/legal-documents/${selected.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'published' })
    });

    if (ok) {
      setMessage(`${LEGAL_DOC_LABELS[selected.docType]} ${selected.version} を公開しました`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-enadia-ink">利用規約・プライバシーポリシー</h2>
        <p className="mt-1 text-xs text-enadia-muted">
          差し替えは<b>上書きではなく、新しいバージョンの追加</b>で行います。公開中の本文を書き換えられないのは、
          「利用者がどの本文に同意したか」の記録が意味を失うのを防ぐためです。
        </p>
      </div>

      <div className="flex gap-2">
        {(['terms', 'privacy'] as LegalDocType[]).map((type) => (
          <button
            className={
              docType === type
                ? 'rounded-lg bg-enadia-primary px-3 py-1.5 text-sm font-semibold text-white'
                : 'rounded-lg border border-enadia-line bg-white px-3 py-1.5 text-sm font-semibold text-enadia-muted'
            }
            key={type}
            onClick={() => {
              setDocType(type);
              setSelectedId(null);
              setEditing(null);
            }}
            type="button"
          >
            {LEGAL_DOC_LABELS[type]}
          </button>
        ))}
      </div>

      {error ? <p className="rounded bg-red-50 p-3 text-sm text-enadia-danger">{error}</p> : null}
      {message ? <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-2">
          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-enadia-line bg-white p-4 text-xs text-enadia-muted">
              まだ登録がありません。
            </p>
          ) : (
            filtered.map((doc) => (
              <button
                className={
                  selected?.id === doc.id
                    ? 'w-full rounded-lg border-2 border-enadia-primary bg-white p-3 text-left'
                    : 'w-full rounded-lg border border-enadia-line bg-white p-3 text-left'
                }
                key={doc.id}
                onClick={() => {
                  setSelectedId(doc.id);
                  setEditing(null);
                }}
                type="button"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-enadia-ink">v{doc.version}</span>
                  <LegalStatusBadge status={doc.status} />
                </div>
                <p className="mt-1 truncate text-xs text-enadia-muted">{doc.title}</p>
              </button>
            ))
          )}
        </aside>

        <div className="space-y-4">
          {selected ? (
            <section className="space-y-3 rounded-lg border border-enadia-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-enadia-ink">
                    {selected.title} <span className="text-enadia-muted">v{selected.version}</span>
                  </h3>
                  <p className="text-xs text-enadia-muted">
                    {selected.status === 'published'
                      ? `公開日 ${selected.publishedAt ? new Date(selected.publishedAt).toLocaleString('ja-JP') : '—'}`
                      : '未公開'}
                    {selected.requiresReconsent ? ' ・ 公開後に再同意を求めます' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selected.status === 'draft' ? (
                    <>
                      <Button
                        onClick={() => setEditing({ title: selected.title, bodyText: selected.body })}
                        size="sm"
                        variant="secondary"
                      >
                        本文を編集
                      </Button>
                      <Button loading={saving} onClick={publish} size="sm">
                        公開する
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>

              {editing ? (
                <div className="space-y-3">
                  <AdminField label="タイトル">
                    <AdminInput
                      onChange={(event) => setEditing({ ...editing, title: event.target.value })}
                      value={editing.title}
                    />
                  </AdminField>
                  <AdminField hint="Markdown（# 見出し / - 箇条書き / **強調**）が使えます" label="本文">
                    <AdminTextarea
                      className="font-mono text-xs"
                      onChange={(event) => setEditing({ ...editing, bodyText: event.target.value })}
                      rows={22}
                      value={editing.bodyText}
                    />
                  </AdminField>
                  <div className="flex gap-2">
                    <Button loading={saving} onClick={saveBody} size="sm">
                      保存
                    </Button>
                    <Button onClick={() => setEditing(null)} size="sm" variant="secondary">
                      やめる
                    </Button>
                  </div>
                </div>
              ) : (
                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs leading-relaxed text-enadia-ink">
                  {selected.body}
                </pre>
              )}
            </section>
          ) : null}

          <section className="space-y-3 rounded-lg border border-enadia-line bg-white p-4">
            <h3 className="text-sm font-bold text-enadia-ink">新しいバージョンを作る</h3>
            <p className="text-xs text-enadia-muted">
              本文を空のままにすると、いま選んでいるバージョンの本文をコピーして下書きを作ります。
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <AdminField label="バージョン" required>
                <AdminInput
                  onChange={(event) => setDraft({ ...draft, version: event.target.value })}
                  placeholder="1.1"
                  value={draft.version}
                />
              </AdminField>
              <AdminField label="タイトル" required>
                <AdminInput
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  placeholder={LEGAL_DOC_LABELS[docType]}
                  value={draft.title}
                />
              </AdminField>
              <AdminField label="施行日">
                <AdminInput
                  onChange={(event) => setDraft({ ...draft, effectiveOn: event.target.value })}
                  type="date"
                  value={draft.effectiveOn}
                />
              </AdminField>
            </div>
            <AdminField label="本文（空ならコピー）">
              <AdminTextarea
                className="font-mono text-xs"
                onChange={(event) => setDraft({ ...draft, bodyText: event.target.value })}
                rows={8}
                value={draft.bodyText}
              />
            </AdminField>
            <AdminField
              hint="統計提供の範囲など、利用者に不利益な変更をするときはチェックしてください"
              label="再同意"
            >
              <AdminSelect
                onChange={(event) => setDraft({ ...draft, requiresReconsent: event.target.value === 'yes' })}
                value={draft.requiresReconsent ? 'yes' : 'no'}
              >
                <option value="no">求めない（軽微な修正）</option>
                <option value="yes">公開後に再同意を求める</option>
              </AdminSelect>
            </AdminField>
            <Button loading={saving} onClick={createVersion}>
              下書きを作成
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
