import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ENADIA Travel',
  description: '旅の写真をまとめて、振り返って、共有するアプリ',
  // ホーム画面に追加したときにアプリらしく見せるための設定
  appleWebApp: {
    capable: true,
    title: 'ENADIA',
    statusBarStyle: 'default'
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: '/apple-icon.png'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  // スマホの上部（時刻やバッテリーの帯）をアプリの色に合わせる
  themeColor: '#0f8b8d'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
