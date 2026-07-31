export type PhotoExif = {
  lat: number | null;
  lng: number | null;
  /** ISO文字列。EXIFの撮影日時（DateTimeOriginal）から作る */
  capturedAt: string | null;
};

export const EMPTY_EXIF: PhotoExif = { lat: null, lng: null, capturedAt: null };

/**
 * EXIFの日時は "2026:07:25 08:00:00" 形式で、タイムゾーン情報を持たない。
 * 国内旅行アプリのため日本時間(+09:00)として解釈する。
 */
export function toIsoDate(value: unknown): string | null {
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

export function toCoordinate(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

/** 緯度と経度は必ずセットで扱う（片方だけあっても地図に置けない） */
export function buildPhotoExif(
  latValue: unknown,
  lngValue: unknown,
  dateValue: unknown,
  fallbackDateValue?: unknown
): PhotoExif {
  const lat = toCoordinate(latValue);
  const lng = toCoordinate(lngValue);
  const hasCoordinates = lat !== null && lng !== null;

  return {
    lat: hasCoordinates ? lat : null,
    lng: hasCoordinates ? lng : null,
    capturedAt: toIsoDate(dateValue) ?? toIsoDate(fallbackDateValue)
  };
}
