'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { Plus } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { DEFAULT_CONQUEST_THEMES } from '@/constants/themes';
import type { ConquestThemeCategory } from '@/types/app';

type CreateConquestProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** すでに作成済みのテーマ名（重複作成を防ぐ） */
  existingNames: string[];
};

const CUSTOM = 'カスタム';

export function CreateConquestProjectModal({
  existingNames,
  onClose,
  onCreated,
  open
}: CreateConquestProjectModalProps) {
  const [selectedName, setSelectedName] = useState<string>(DEFAULT_CONQUEST_THEMES[0].name);
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('🎯');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustom = selectedName === CUSTOM;
  const selectedTheme = DEFAULT_CONQUEST_THEMES.find((theme) => theme.name === selectedName);
  const resolvedName = isCustom ? customName.trim() : selectedName;

  async function save() {
    if (resolvedName.length === 0) {
      setError('テーマ名を入力してください。');
      return;
    }

    if (existingNames.includes(resolvedName)) {
      setError(`「${resolvedName}」はすでに作成済みです。`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/conquest-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: resolvedName,
          emoji: isCustom ? customEmoji.trim() || '🎯' : selectedTheme?.emoji ?? '🎯',
          color: '#0f8b8d',
          description: description.trim() || null,
          category: (isCustom ? 'custom' : selectedTheme?.category ?? 'custom') as ConquestThemeCategory,
          isPublic: false
        })
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? 'テーマの作成に失敗しました。');
        return;
      }

      // 次に開いたときのために入力内容を初期化する
      setCustomName('');
      setDescription('');
      onCreated();
      onClose();
    } catch {
      setError('通信に失敗しました。時間をおいて試してください。');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} open={open} testId="create-conquest-project-modal" title="制覇テーマを作成">
      <div className="space-y-4">
        <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-enadia-muted">
          「地酒」「温泉」など、旅先で集めたいテーマを決めましょう。作成後、旅の写真から記録を追加すると、その都道府県が制覇マップに反映されます。
        </p>

        <div>
          <span className="text-sm font-bold text-enadia-ink">テーマ</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {[...DEFAULT_CONQUEST_THEMES.filter((theme) => theme.name !== CUSTOM), { name: CUSTOM, emoji: '🎯', category: 'custom' as ConquestThemeCategory }].map(
              (theme) => {
                const alreadyAdded = theme.name !== CUSTOM && existingNames.includes(theme.name);

                return (
                  <button
                    className={clsx(
                      'rounded-full border px-3 py-1.5 text-xs font-bold transition',
                      selectedName === theme.name
                        ? 'border-enadia-primary bg-enadia-primary text-white'
                        : 'border-enadia-line bg-white text-enadia-muted hover:bg-slate-50',
                      alreadyAdded && 'opacity-40'
                    )}
                    disabled={alreadyAdded}
                    key={theme.name}
                    onClick={() => {
                      setSelectedName(theme.name);
                      setError(null);
                    }}
                    type="button"
                  >
                    {theme.emoji} {theme.name}
                    {alreadyAdded ? '（作成済み）' : ''}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {isCustom ? (
          <div className="flex gap-2">
            <label className="w-20 shrink-0">
              <span className="text-sm font-bold text-enadia-ink">絵文字</span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-enadia-line px-3 text-center text-lg"
                maxLength={4}
                onChange={(event) => setCustomEmoji(event.target.value)}
                value={customEmoji}
              />
            </label>
            <label className="min-w-0 flex-1">
              <span className="text-sm font-bold text-enadia-ink">テーマ名</span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-enadia-line px-3 text-sm"
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="例：道の駅、灯台"
                value={customName}
              />
            </label>
          </div>
        ) : null}

        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">説明（任意）</span>
          <textarea
            className="mt-2 min-h-20 w-full rounded-lg border border-enadia-line p-3 text-sm"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="全国の地酒を旅先で記録する"
            value={description}
          />
        </label>

        {error ? <p className="text-sm text-enadia-danger">{error}</p> : null}

        <div className="flex gap-2">
          <Button className="flex-1" onClick={onClose} variant="secondary">
            キャンセル
          </Button>
          <Button
            className="flex-1"
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            loading={saving}
            onClick={save}
          >
            作成
          </Button>
        </div>
      </div>
    </Modal>
  );
}
