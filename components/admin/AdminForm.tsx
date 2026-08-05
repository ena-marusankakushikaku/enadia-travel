'use client';

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';

const fieldClass =
  'w-full rounded-lg border border-enadia-line bg-white px-3 py-2 text-sm text-enadia-ink placeholder:text-slate-400 focus:border-enadia-primary focus:outline-none focus:ring-1 focus:ring-enadia-primary';

export function AdminField({
  children,
  hint,
  label,
  required
}: {
  children: ReactNode;
  hint?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-enadia-ink">
        {label}
        {required ? <span className="ml-1 text-enadia-danger">*</span> : null}
      </span>
      <div className="mt-1">{children}</div>
      {hint ? <span className="mt-1 block text-xs text-enadia-muted">{hint}</span> : null}
    </label>
  );
}

export function AdminInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(fieldClass, className)} {...props} />;
}

export function AdminSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx(fieldClass, className)} {...props} />;
}

export function AdminTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(fieldClass, 'leading-relaxed', className)} {...props} />;
}
