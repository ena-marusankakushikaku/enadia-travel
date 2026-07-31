'use client';

import { useEffect, useState } from 'react';
import { Check, MapPin } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { RatingInput } from '@/components/conquest/RatingInput';
import { getPrefectureName } from '@/constants/japan';
import type { ConquestEntry, ConquestProject } from '@/types/app';

type EditThemeEntryModalProps = {
  entry: ConquestEntry | null;
  project: ConquestProject | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

/** ISO文字列を input[type=date] 用の YYYY-MM-DD（日本時間）に変換する */
function toDateInput(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return new Date(parsed.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function EditThemeEntryModal({ entry, onClose, onSaved, open, project }: EditThemeEntryModalProps) {
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [visitedAt, setVisitedAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 別の記録を開いたときに、その記録の内容でフォームを初期化する
  useEffect(() => {
    setTitle(entry?.title ?? '');
    setMemo(entry?.memo ?? '');
    setRating(entry?.rating ?? null);
    setVisitedAt(entry ? toDateInput(entry.visitedAt) : '');
    setError(null);
  }, [entry]);

  async function save() {
    if (!entry || saving) {
      return;
    }

    if (title.trim().length === 0) {
      setError('店名・商品名を入力してください。');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/conquest-entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          memo,
          rating,
          // 日付だけの入力なので、日本時間の0時として保存する
          visitedAt: visitedAt ? new Date(`${visitedAt}T00:00:00+09:00`).toISOString() : undefined
        })
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? '保存に失敗しました。');
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError('通信に失敗しました。時間をおいて試してください。');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} open={open} testId="edit-theme-entry-modal" title="記録を編集">
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-bold text-enadia-primary">
            {project?.emoji ?? '🎯'} {project?.name ?? 'テーマ'}
          </p>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-enadia-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {entry?.prefectureId ? getPrefectureName(entry.prefectureId) : '海外'} / {entry?.placeName ?? '地点未設定'}
          </p>
          <p className="mt-1 text-[11px] text-enadia-muted">
            場所は写真の情報と連動しています。変更したいときは写真側で「場所を修正」してください。
          </p>
        </div>

        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">店名・商品名</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-enadia-line px-3 text-sm"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例：獺祭 純米大吟醸、道後温泉本館"
            value={title}
          />
        </label>

        <RatingInput onChange={setRating} value={rating} />

        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">訪問日</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-enadia-line px-3 text-sm"
            onChange={(event) => setVisitedAt(event.target.value)}
            type="date"
            value={visitedAt}
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">メモ（任意）</span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-lg border border-enadia-line p-3 text-sm"
            onChange={(event) => setMemo(event.target.value)}
            placeholder="味の感想や、また行きたい理由など"
            value={memo}
          />
        </label>

        {error ? <p className="text-sm text-enadia-danger">{error}</p> : null}

        <div className="flex gap-2">
          <Button className="flex-1" onClick={onClose} variant="secondary">
            キャンセル
          </Button>
          <Button
            className="flex-1"
            icon={<Check className="h-4 w-4" aria-hidden="true" />}
            loading={saving}
            onClick={save}
          >
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}
