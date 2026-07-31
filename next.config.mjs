/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    /**
     * 一度表示した画面をブラウザ側に保持しておく時間（秒）。
     *
     * これが短いと、タブを行き来するたびにサーバーへ取りに行き直すため
     * 毎回待ち時間が発生する。60秒保持しておけば、タブの切り替えは
     * ほぼ待ち時間なしになる。
     *
     * 写真の追加などで内容が変わったときは router.refresh() を呼んでいるので、
     * 古い内容が残り続けることはない。
     */
    staleTimes: {
      dynamic: 60,
      static: 300
    }
  }
};

export default nextConfig;
