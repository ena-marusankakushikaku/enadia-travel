import { clsx } from 'clsx';

/**
 * 「PR」バッジ。
 *
 * 景品表示法の指定告示（2023年10月1日施行）により、事業者が自社の商品・役務について行う表示なのに
 * 一般消費者がそれと判別できない表示は違反になる。スポンサードテーマはこれに当たりうるため、
 * **提供元が付いているテーマには必ず表示する**。
 *
 * 判断を入稿者に委ねず、theme_templates.is_sponsored から自動で出す形にしてあるのは、
 * 「今回は付け忘れた」を構造的に起こさないため。小さくしない・隠さない・スクロールせずに見える位置に置く。
 */
export function SponsoredBadge({
  className,
  variant = 'solid'
}: {
  className?: string;
  variant?: 'solid' | 'soft';
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded px-2 py-0.5 text-[10px] font-extrabold tracking-[0.08em]',
        variant === 'solid' ? 'bg-enadia-accent text-white' : 'bg-amber-50 text-amber-700',
        className
      )}
    >
      PR
    </span>
  );
}

/** 「提供：〇〇」の表記 */
export function SponsorCredit({
  className,
  displayName
}: {
  className?: string;
  displayName: string;
}) {
  return <p className={clsx('text-xs text-enadia-muted', className)}>提供：{displayName}</p>;
}
