import type { MetadataRoute } from 'next';

/**
 * ホーム画面に追加したときの見え方を決める設定。
 *
 * これがあると、スマホのホーム画面に置いたアイコンから開いたときに
 * ブラウザのアドレスバーが消え、ふつうのアプリのような見た目になる。
 * ネイティブアプリではないが、体感はかなり近づく。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ENADIA Travel',
    short_name: 'ENADIA',
    description: '旅の写真をまとめて、振り返って、共有するアプリ',
    start_url: '/trips',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f4f7fb',
    theme_color: '#0f8b8d',
    lang: 'ja',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  };
}
