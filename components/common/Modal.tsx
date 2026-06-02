'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

type ModalProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  closeOnOverlayClick?: boolean;
  testId?: string;
};

export function Modal({
  children,
  closeOnOverlayClick = true,
  onClose,
  open,
  testId,
  title
}: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousActive = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }

      if (event.key !== 'Tab') {
        return;
      }

      const panel = document.querySelector<HTMLElement>('[data-modal-panel="true"]');
      const focusable = panel?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusable || focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousActive?.focus();
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center"
      data-testid={testId}
      role="dialog"
    >
      <button
        aria-label="閉じる"
        className="absolute inset-0 h-full w-full bg-slate-950/45"
        onClick={closeOnOverlayClick ? onClose : undefined}
        type="button"
      />
      <section
        className={clsx(
          'safe-bottom relative w-full max-w-[480px] rounded-t-2xl bg-white p-5 shadow-sheet',
          'max-h-[86dvh] overflow-y-auto'
        )}
        data-modal-panel="true"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-enadia-ink">{title}</h2>
          <button
            aria-label="閉じる"
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-enadia-muted transition hover:bg-slate-200"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
