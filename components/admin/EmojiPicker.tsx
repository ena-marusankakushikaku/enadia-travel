'use client';

import { useState } from 'react';
import { clsx } from 'clsx';

/**
 * 絵文字の選択。
 *
 * WindowsのPCでは「Windowsキー + .（ピリオド）」で絵文字パネルが出せるが、
 * 知らないと入力欄の前で手が止まる。テーマの絵文字は候補が限られるので、
 * よく使うものをタップで選べるようにしておくほうが速い。
 */
const PRESETS = [
  '📍', '🗾', '⛩️', '🏯', '♨️', '🍶', '🍜', '🍣',
  '🐟', '🦐', '🍰', '☕', '🍺', '🥟', '🌸', '🍁',
  '🗻', '🌊', '🏝️', '💧', '🗼', '🚉', '🚗', '🚢',
  '🎣', '⛷️', '🥾', '🚲', '🎆', '🏮', '🎨', '📷',
  '🐶', '🐱', '🦌', '🐄', '🌟', '🎯', '🎁', '🏅'
];

export function EmojiPicker({
  onChange,
  value
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          className="w-20 rounded-lg border border-enadia-line bg-white px-3 py-2 text-center text-lg focus:border-enadia-primary focus:outline-none"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
        <button
          className="rounded-lg border border-enadia-line bg-white px-3 py-2 text-xs font-semibold text-enadia-ink transition hover:bg-slate-50"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {open ? '閉じる' : '選ぶ'}
        </button>
      </div>

      {open ? (
        <div className="mt-2 grid grid-cols-8 gap-1 rounded-lg border border-enadia-line bg-white p-2">
          {PRESETS.map((emoji) => (
            <button
              className={clsx(
                'rounded-md py-1.5 text-lg transition hover:bg-slate-100',
                value === emoji && 'bg-enadia-primary/10 ring-1 ring-enadia-primary'
              )}
              key={emoji}
              onClick={() => {
                onChange(emoji);
                setOpen(false);
              }}
              type="button"
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}

      <p className="mt-1 text-xs text-enadia-muted">
        ここに無いものは、入力欄を選んでから <b>Windowsキー + .（ピリオド）</b> で絵文字パネルを開けます。
      </p>
    </div>
  );
}
