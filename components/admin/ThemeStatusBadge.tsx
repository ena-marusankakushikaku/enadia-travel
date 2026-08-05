import { clsx } from 'clsx';
import type { LegalDocStatus, ThemeStatus } from '@/types/app';

const THEME_LABELS: Record<ThemeStatus, string> = {
  draft: '下書き',
  published: '公開中',
  closed: '掲載終了'
};

const LEGAL_LABELS: Record<LegalDocStatus, string> = {
  draft: '下書き',
  published: '公開中',
  archived: '過去版'
};

const TONE: Record<string, string> = {
  draft: 'bg-slate-100 text-enadia-muted',
  published: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-slate-100 text-slate-500',
  archived: 'bg-slate-100 text-slate-500'
};

export function ThemeStatusBadge({ status }: { status: ThemeStatus }) {
  return (
    <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-bold', TONE[status])}>
      {THEME_LABELS[status]}
    </span>
  );
}

export function LegalStatusBadge({ status }: { status: LegalDocStatus }) {
  return (
    <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-bold', TONE[status])}>
      {LEGAL_LABELS[status]}
    </span>
  );
}
