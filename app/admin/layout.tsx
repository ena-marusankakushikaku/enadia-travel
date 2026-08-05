import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BarChart3, FileText, MapPinned, Settings, Building2, ArrowLeft } from 'lucide-react';
import { getAdminUser } from '@/lib/api/admin';

const NAV = [
  { href: '/admin', label: 'ダッシュボード', icon: BarChart3 },
  { href: '/admin/themes', label: 'テーマ入稿', icon: MapPinned },
  { href: '/admin/sponsors', label: '提供元', icon: Building2 },
  { href: '/admin/legal', label: '規約', icon: FileText },
  { href: '/admin/settings', label: '設定', icon: Settings }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();

  // 管理者でなければ、管理画面があること自体を見せずに旅の一覧へ戻す
  if (!admin) {
    redirect('/trips');
  }

  return (
    <div className="min-h-dvh bg-enadia-canvas">
      <header className="border-b border-enadia-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-enadia-primary">ENADIA</p>
            <h1 className="text-lg font-bold text-enadia-ink">管理コンソール</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-enadia-muted">
            <span className="hidden sm:inline">{admin.email}</span>
            <Link
              className="inline-flex items-center gap-1 rounded-lg border border-enadia-line px-3 py-1.5 font-semibold text-enadia-ink transition hover:bg-slate-50"
              href="/trips"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              アプリへ
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 pb-2">
          {NAV.map((item) => (
            <Link
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-enadia-muted transition hover:bg-slate-100 hover:text-enadia-ink"
              href={item.href}
              key={item.href}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
    </div>
  );
}
