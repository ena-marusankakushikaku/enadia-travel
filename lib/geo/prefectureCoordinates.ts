// 各都道府県の代表座標（県庁所在地）。
// 国土地理院APIが使えなかったときのフォールバック専用で、
// 「最も近い県庁所在地の都道府県」を概算で求めるために使う。
// 県境付近や離島では実際と異なる可能性があるため、確度(confidence)は低めに記録する。

export type PrefectureCoordinate = {
  id: number;
  lat: number;
  lng: number;
};

export const PREFECTURE_COORDINATES: PrefectureCoordinate[] = [
  { id: 1, lat: 43.0642, lng: 141.3469 },
  { id: 2, lat: 40.8244, lng: 140.74 },
  { id: 3, lat: 39.7036, lng: 141.1527 },
  { id: 4, lat: 38.2688, lng: 140.8721 },
  { id: 5, lat: 39.7186, lng: 140.1024 },
  { id: 6, lat: 38.2404, lng: 140.3633 },
  { id: 7, lat: 37.75, lng: 140.4678 },
  { id: 8, lat: 36.3418, lng: 140.4468 },
  { id: 9, lat: 36.5657, lng: 139.8836 },
  { id: 10, lat: 36.3907, lng: 139.0604 },
  { id: 11, lat: 35.857, lng: 139.6489 },
  { id: 12, lat: 35.6051, lng: 140.1233 },
  { id: 13, lat: 35.6895, lng: 139.6917 },
  { id: 14, lat: 35.4478, lng: 139.6425 },
  { id: 15, lat: 37.9026, lng: 139.0232 },
  { id: 16, lat: 36.6953, lng: 137.2113 },
  { id: 17, lat: 36.5947, lng: 136.6256 },
  { id: 18, lat: 36.0652, lng: 136.2216 },
  { id: 19, lat: 35.6642, lng: 138.5684 },
  { id: 20, lat: 36.6513, lng: 138.181 },
  { id: 21, lat: 35.3912, lng: 136.7223 },
  { id: 22, lat: 34.9769, lng: 138.3831 },
  { id: 23, lat: 35.1802, lng: 136.9066 },
  { id: 24, lat: 34.7303, lng: 136.5086 },
  { id: 25, lat: 35.0045, lng: 135.8686 },
  { id: 26, lat: 35.0212, lng: 135.7556 },
  { id: 27, lat: 34.6863, lng: 135.52 },
  { id: 28, lat: 34.6913, lng: 135.183 },
  { id: 29, lat: 34.6851, lng: 135.8329 },
  { id: 30, lat: 34.2261, lng: 135.1675 },
  { id: 31, lat: 35.5039, lng: 134.2381 },
  { id: 32, lat: 35.4723, lng: 133.0505 },
  { id: 33, lat: 34.6618, lng: 133.935 },
  { id: 34, lat: 34.3966, lng: 132.4596 },
  { id: 35, lat: 34.1859, lng: 131.4714 },
  { id: 36, lat: 34.0658, lng: 134.5593 },
  { id: 37, lat: 34.3401, lng: 134.0434 },
  { id: 38, lat: 33.8416, lng: 132.7657 },
  { id: 39, lat: 33.5597, lng: 133.5311 },
  { id: 40, lat: 33.6064, lng: 130.4181 },
  { id: 41, lat: 33.2494, lng: 130.2989 },
  { id: 42, lat: 32.7448, lng: 129.8737 },
  { id: 43, lat: 32.7898, lng: 130.7417 },
  { id: 44, lat: 33.2382, lng: 131.6126 },
  { id: 45, lat: 31.9111, lng: 131.4239 },
  { id: 46, lat: 31.5602, lng: 130.5581 },
  { id: 47, lat: 26.2124, lng: 127.6809 }
];

// 日本国内かどうかのおおまかな判定（離島を含む広めの範囲）。
// 範囲外なら「日本のどこか」に丸めるのは誤りなので、都道府県を付けない。
export function isWithinJapanBounds(lat: number, lng: number): boolean {
  return lat >= 20 && lat <= 46 && lng >= 122 && lng <= 154;
}

export function findNearestPrefectureId(lat: number, lng: number): number | null {
  if (!isWithinJapanBounds(lat, lng)) {
    return null;
  }

  let nearestId: number | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const prefecture of PREFECTURE_COORDINATES) {
    // 緯度1度あたりの距離に対し、経度1度は cos(緯度) 倍になるため補正する
    const latDiff = prefecture.lat - lat;
    const lngDiff = (prefecture.lng - lng) * Math.cos((lat * Math.PI) / 180);
    const distance = latDiff * latDiff + lngDiff * lngDiff;

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestId = prefecture.id;
    }
  }

  return nearestId;
}
