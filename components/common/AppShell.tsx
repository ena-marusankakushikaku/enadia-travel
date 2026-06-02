import { BottomNav } from '@/components/common/BottomNav';

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function AppShell({ action, children, subtitle, title = 'ENADIA Travel' }: AppShellProps) {
  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-enadia-canvas shadow-mobile">
      <div className="min-h-dvh bg-enadia-canvas pb-24">
        <header className="sticky top-0 z-20 border-b border-enadia-line/80 bg-white/92 px-5 pb-3 pt-[max(16px,env(safe-area-inset-top))] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-enadia-primary">ENADIA</p>
              <h1 className="truncate text-xl font-bold text-enadia-ink">{title}</h1>
              {subtitle ? <p className="mt-1 truncate text-sm text-enadia-muted">{subtitle}</p> : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        </header>
        <main className="px-5 py-5">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
