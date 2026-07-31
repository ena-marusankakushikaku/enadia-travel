import 'server-only';

import exifr from 'exifr';
import { buildPhotoExif, EMPTY_EXIF, type PhotoExif } from '@/lib/geo/exifValues';

export type { PhotoExif };

/**
 * 写真ファイルからGPS座標と撮影日時を取り出す（サーバー側）。
 *
 * 現在の主経路はブラウザ側での抽出（lib/geo/photoExifClient.ts）。
 * アップロード前に画像を縮小するとEXIFが消えるため、先に読み取って値を送っている。
 * ここは、その値が送られてこなかった場合の予備として残している。
 *
 * EXIFが無い写真（SNS経由・スクリーンショット等）も普通にあるため、
 * 失敗しても例外は投げず、すべてnullで返す。
 */
export async function extractPhotoExif(file: ArrayBuffer | Uint8Array): Promise<PhotoExif> {
  // Uint8Array(Buffer)は使い回しの領域を指していることがあるため、
  // ArrayBufferを直接渡さず、実データの範囲だけを見るようにする
  const buffer =
    file instanceof Uint8Array ? Buffer.from(file.buffer, file.byteOffset, file.byteLength) : Buffer.from(file);

  const gps = await exifr.gps(buffer).catch(() => null);
  const meta = await exifr
    .parse(buffer, {
      pick: ['DateTimeOriginal', 'CreateDate'],
      reviveValues: false
    })
    .catch(() => null);

  if (!gps && !meta) {
    return EMPTY_EXIF;
  }

  return buildPhotoExif(gps?.latitude, gps?.longitude, meta?.DateTimeOriginal, meta?.CreateDate);
}
