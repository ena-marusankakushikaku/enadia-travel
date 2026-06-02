'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { BOTTOM_NAV_ITEMS } from '@/constants/navigation';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-enadia-line bg-white/95 px-4 pt-2 shadow-[0_-8px_28px_rgba(24,33,47,0.08)] backdrop-blur">
      <div className="grid grid-cols-5 items-end gap-1">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (!item.isPrimary && pathname.startsWith(`${item.href}/`));

          if (item.isPrimary) {
            return (
              <Link
                aria-label={item.label}
                className="mx-auto -mt-6 grid h-14 w-14 place-items-center rounded-full bg-enadia-primary text-white shadow-lg shadow-teal-900/20 transition hover:bg-enadia-primaryDark"
                href={item.href}
                key={item.href}
              >
                <Icon className="h-7 w-7" aria-hidden="true" />
              </Link>
            );
          }

          return (
            <Link
              className={clsx(
                'flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition',
                isActive ? 'text-enadia-primary' : 'text-enadia-muted hover:bg-slate-50 hover:text-enadia-ink'
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
