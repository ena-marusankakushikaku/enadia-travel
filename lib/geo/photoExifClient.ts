'use client';

import { buildPhotoExif, EMPTY_EXIF, type PhotoExif } from '@/lib/geo/exifValues';

/**
 * ブラウザ側で写真からGPS座標と撮影日時を取り出す。
 *
 * アップロード前に画像を縮小するようになったが、canvasで描き直すとEXIFが消えてしまう。
 * そのため「縮小する前に」ここで読み取り、値だけをサーバーへ送る。
 *
 * EXIFの解析ライブラリはそれなりの大きさがあるので、
 * アップロードするときに初めて読み込む（最初の画面表示を重くしない）。
 */
export async function extractPhotoExifFromFile(file: File): Promise<PhotoExif> {
  try {
    const exifr = (await import('exifr')).default;

    const gps = await exifr.gps(file).catch(() => null);
    const meta = await exifr
      .parse(file, { pick: ['DateTimeOriginal', 'CreateDate'], reviveValues: false })
      .catch(() => null);

    return buildPhotoExif(gps?.latitude, gps?.longitude, meta?.DateTimeOriginal, meta?.CreateDate);
  } catch {
    // EXIFが無い写真（SNS経由・スクリーンショット等）は普通にあるので、失敗しても素通りさせる
    return EMPTY_EXIF;
  }
}
