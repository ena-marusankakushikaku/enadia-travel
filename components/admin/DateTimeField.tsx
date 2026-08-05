'use client';

/**
 * 日時の入力。
 *
 * `<input type="datetime-local">` は、ブラウザが出す時刻の選択リストが
 * 分刻みで延々と並ぶため、キャンペーンの開始・終了のような
 * 「日付が主で、時刻はだいたいでよい」入力にはとても押しにくい。
 *
 * そこで日付と時刻を分け、時刻には既定値（開始 00:00 / 終了 23:59）を入れておく。
 * 日付を入れた時点で時刻が埋まるので、ほとんどの場合は日付を選ぶだけで終わる。
 *
 * 値の形式は `<input type="datetime-local">` と同じ "YYYY-MM-DDTHH:mm" にしてあるので、
 * 呼び出し側は `new Date(value).toISOString()` をこれまでどおり使える。
 */
type Props = {
  value: string;
  onChange: (value: string) => void;
  /** 日付だけ入れたときに補う時刻。開始は "00:00"、終了は "23:59" を推奨 */
  defaultTime?: string;
};

export function DateTimeField({ defaultTime = '00:00', onChange, value }: Props) {
  const [datePart = '', timePart = ''] = value ? value.split('T') : ['', ''];

  function handleDate(next: string) {
    if (!next) {
      onChange('');
      return;
    }
    onChange(`${next}T${timePart || defaultTime}`);
  }

  function handleTime(next: string) {
    if (!datePart) {
      // 日付が無いまま時刻だけ入れても意味がないので、何もしない
      return;
    }
    onChange(`${datePart}T${next || defaultTime}`);
  }

  return (
    <div className="flex gap-2">
      <input
        className="flex-1 rounded-lg border border-enadia-line bg-white px-3 py-2 text-sm text-enadia-ink focus:border-enadia-primary focus:outline-none"
        onChange={(event) => handleDate(event.target.value)}
        type="date"
        value={datePart}
      />
      <input
        className="w-28 rounded-lg border border-enadia-line bg-white px-3 py-2 text-sm text-enadia-ink focus:border-enadia-primary focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
        disabled={!datePart}
        onChange={(event) => handleTime(event.target.value)}
        step={300}
        type="time"
        value={timePart}
      />
    </div>
  );
}
