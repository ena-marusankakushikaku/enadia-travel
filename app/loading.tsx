/**
 * 画面を切り替えている間に出す表示。
 *
 * この画面のデータはサーバー側で用意しているため、タブを押してから
 * 新しい画面が出るまでにわずかな待ち時間がある。
 * これが無いと押しても何も起きないように見えるので、必ず即座に反応を返す。
 */
export default function Loading() {
  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-enadia-canvas shadow-mobile">
      <div className="min-h-dvh bg-enadia-canvas pb-24">
        <header className="sticky top-0 z-20 border-b border-enadia-line/80 bg-white/92 px-5 pb-3 pt-[max(16px,env(safe-area-inset-top))] backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-enadia-primary">ENADIA</p>
          <div className="mt-1 h-6 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-24 animate-pulse rounded bg-slate-100" />
        </header>

        <main className="space-y-4 px-5 py-5">
          <div className="h-28 animate-pulse rounded-lg bg-slate-200/70" />
          <div className="h-20 animate-pulse rounded-lg bg-slate-200/60" />
          <div className="h-20 animate-pulse rounded-lg bg-slate-200/50" />
          <p className="pt-2 text-center text-xs text-enadia-muted">読み込んでいます…</p>
        </main>
      </div>
    </div>
  );
}
