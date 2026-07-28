import 'server-only';

import exifr from 'exifr';

export type PhotoExif = {
  lat: number | null;
  lng: number | null;
  /** ISO文字列。EXIFの撮影日時（DateTimeOriginal）から作る */
  capturedAt: string | null;
};

const EMPTY_EXIF: PhotoExif = { lat: null, lng: null, capturedAt: null };

/**
 * EXIFの日時は "2026:07:25 08:00:00" 形式で、タイムゾーン情報を持たない。
 * 国内旅行アプリのため日本時間(+09:00)として解釈する。
 */
function toIsoDate(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (typeof value !== 'string') {
    return null;
  }

  const matched = value.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!matched) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = matched;
  const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toCoordinate(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

/**
 * 写真ファイルからGPS座標と撮影日時を取り出す。
 * EXIFが無い写真（SNS経由・スクリーンショット等）も普通にあるため、
 * 失敗しても例外は投げず、すべてnullで返す。
 */
export async function extractPhotoExif(file: ArrayBuffer | Uint8Array): Promise<PhotoExif> {
  // Uint8Array(Buffer)は使い回しの領域を指していることがあるため、
  // ArrayBufferを直接渡さず、実データの範囲だけを見るようにする
  const buffer = file instanceof Uint8Array ? Buffer.from(file.buffer, file.byteOffset, file.byteLength) : Buffer.from(file);

  const gps = await exifr.gps(buffer).catch(() => null);
  const meta = await exifr
    .parse(buffer, {
      pick: ['DateTimeOriginal', 'CreateDate'],
      reviveValues: false
    })
    .catch(() => null);

  const lat = toCoordinate(gps?.latitude);
  const lng = toCoordinate(gps?.longitude);

  // 緯度と経度は必ずセットで扱う（片方だけあっても地図に置けない）
  const hasCoordinates = lat !== null && lng !== null;

  return {
    ...EMPTY_EXIF,
    lat: hasCoordinates ? lat : null,
    lng: hasCoordinates ? lng : null,
    capturedAt: toIsoDate(meta?.DateTimeOriginal) ?? toIsoDate(meta?.CreateDate)
  };
}
