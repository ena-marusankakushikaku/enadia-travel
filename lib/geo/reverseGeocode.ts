import 'server-only';

import { formatPlaceName, getPrefectureName } from '@/constants/japan';
import { findNearestPrefectureId, isWithinJapanBounds } from '@/lib/geo/prefectureCoordinates';

// 国土地理院の逆ジオコーディングAPI（APIキー不要・無料）
// 例: {"results":{"muniCd":"01102","lv01Nm":"北六条西三丁目"}}
const GSI_ENDPOINT = 'https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress';
const GSI_TIMEOUT_MS = 5000;

export type ResolvedLocation = {
  prefectureId: number;
  placeName: string | null;
  /** 0〜1。APIで確定できたら1.0、県庁所在地からの概算なら0.6 */
  confidence: number;
  source: 'gsi' | 'offline';
};

/**
 * 市区町村コード(muniCd)の先頭2桁が都道府県コード(JIS X 0401)で、
 * これはアプリ内の prefectureId と一致する。
 * 国土地理院は "01102" のような5桁を返すが、先頭ゼロが落ちた "1102" も想定して桁を揃える。
 */
export function prefectureIdFromMuniCd(muniCd: string): number | null {
  const digits = String(muniCd).replace(/[^0-9]/g, '');
  if (digits.length < 4 || digits.length > 5) {
    return null;
  }

  const prefectureId = Number.parseInt(digits.padStart(5, '0').slice(0, 2), 10);
  if (!Number.isInteger(prefectureId) || prefectureId < 1 || prefectureId > 47) {
    return null;
  }

  return prefectureId;
}

async function fetchFromGsi(lat: number, lng: number): Promise<ResolvedLocation | null> {
  try {
    const url = `${GSI_ENDPOINT}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(GSI_TIMEOUT_MS)
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      results?: { muniCd?: string | number; lv01Nm?: string } | null;
    };

    const muniCd = data?.results?.muniCd;
    if (muniCd === undefined || muniCd === null) {
      // 海上など、住所が存在しない座標
      return null;
    }

    const prefectureId = prefectureIdFromMuniCd(String(muniCd));
    if (prefectureId === null) {
      return null;
    }

    const areaName = typeof data.results?.lv01Nm === 'string' ? data.results.lv01Nm.trim() : '';

    return {
      prefectureId,
      placeName: formatPlaceName(prefectureId, areaName),
      confidence: 1,
      source: 'gsi'
    };
  } catch {
    // タイムアウト・ネットワークエラー・JSON崩れは、すべてフォールバックに回す
    return null;
  }
}

/**
 * 緯度経度から都道府県と地点名を求める。
 * まず国土地理院APIを使い、失敗したら県庁所在地からの概算で都道府県だけ埋める。
 * どちらも決められない場合は null（＝場所未設定のまま）を返す。
 */
export async function resolveLocation(lat: number, lng: number): Promise<ResolvedLocation | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  if (!isWithinJapanBounds(lat, lng)) {
    // 国外の写真は都道府県を持たないので、座標だけ保存する
    return null;
  }

  const fromGsi = await fetchFromGsi(lat, lng);
  if (fromGsi) {
    return fromGsi;
  }

  const nearestId = findNearestPrefectureId(lat, lng);
  if (nearestId === null) {
    return null;
  }

  return {
    prefectureId: nearestId,
    placeName: getPrefectureName(nearestId),
    confidence: 0.6,
    source: 'offline'
  };
}
