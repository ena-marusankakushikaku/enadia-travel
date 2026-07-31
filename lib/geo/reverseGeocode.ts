import 'server-only';

import { formatPlaceName, getPrefectureName } from '@/constants/japan';
import { findCountryCode, getCountryName } from '@/constants/world';
import { findNearestPrefectureId, isWithinJapanBounds } from '@/lib/geo/prefectureCoordinates';

// 国土地理院の逆ジオコーディングAPI（APIキー不要・無料）
// 例: {"results":{"muniCd":"01102","lv01Nm":"北六条西三丁目"}}
const GSI_ENDPOINT = 'https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress';
const GSI_TIMEOUT_MS = 5000;

// 海外向け。OpenStreetMapのNominatim（APIキー不要・無料）
// 利用規約でUser-Agentの明示と、1秒あたり1リクエストまでの制限がある。
// 写真は1枚ずつ順番にアップロードしているので通常は超えないが、
// 失敗しても地図データから求めた国名にフォールバックするので実害は出ない。
const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';
const NOMINATIM_TIMEOUT_MS = 5000;
const NOMINATIM_USER_AGENT = 'ENADIA-Travel/1.0 (travel photo app; contact via app)';

export type ResolvedLocation = {
  /** 日本国内のときだけ入る */
  prefectureId: number | null;
  /** 国コード（ISO 3166-1 alpha-2）。日本国内なら 'JP' */
  countryCode: string | null;
  placeName: string | null;
  /** 0〜1。APIで確定できたら1.0、地図データや県庁所在地からの概算なら低くなる */
  confidence: number;
  source: 'gsi' | 'offline' | 'nominatim' | 'atlas';
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
      countryCode: 'JP',
      placeName: formatPlaceName(prefectureId, areaName),
      confidence: 1,
      source: 'gsi'
    };
  } catch {
    // タイムアウト・ネットワークエラー・JSON崩れは、すべてフォールバックに回す
    return null;
  }
}

type NominatimAddress = {
  country?: string;
  state?: string;
  province?: string;
  region?: string;
  county?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  city_district?: string;
};

/**
 * 表示用の地点名を「フランス パリ 7区」の形に組み立てる。
 * 頭に国名を置くのは、国内の「石川県 広坂一丁目」と読み方をそろえるため。
 */
export function formatOverseasPlaceName(countryName: string, parts: (string | undefined)[]): string {
  const details: string[] = [];

  for (const part of parts) {
    const trimmed = part?.trim();
    if (!trimmed || trimmed === countryName || details.includes(trimmed)) {
      continue;
    }
    details.push(trimmed);
  }

  // 細かすぎても読みにくいので2つまで
  const detail = details.slice(0, 2).join(' ');
  return detail ? `${countryName} ${detail}` : countryName;
}

async function fetchFromNominatim(
  lat: number,
  lng: number,
  countryCode: string,
  countryName: string
): Promise<ResolvedLocation | null> {
  try {
    const url =
      `${NOMINATIM_ENDPOINT}?format=jsonv2&zoom=12&accept-language=ja` +
      `&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'User-Agent': NOMINATIM_USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(NOMINATIM_TIMEOUT_MS)
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { address?: NominatimAddress | null };
    const address = data.address;
    if (!address) {
      return null;
    }

    // 地図データから求めた国名を優先する。表記ゆれが少なく、地図の色分けとも一致するため
    const placeName = formatOverseasPlaceName(countryName, [
      address.state ?? address.province ?? address.region ?? address.county,
      address.city ?? address.town ?? address.village ?? address.municipality,
      address.suburb ?? address.city_district
    ]);

    return {
      prefectureId: null,
      countryCode,
      placeName,
      confidence: 1,
      source: 'nominatim'
    };
  } catch {
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
    return resolveOverseasLocation(lat, lng);
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
    countryCode: 'JP',
    placeName: getPrefectureName(nearestId),
    confidence: 0.6,
    source: 'offline'
  };
}

/**
 * 日本国外の座標から国と地点名を求める。
 *
 * まず同梱の世界地図データで国を確定させる（外部サービスに頼らないので必ず動く）。
 * そのうえでNominatimに都市名まで問い合わせ、取れなければ国名だけで保存する。
 * 海の上など、どの国にも属さない座標は null（＝場所未設定）。
 */
async function resolveOverseasLocation(lat: number, lng: number): Promise<ResolvedLocation | null> {
  const countryCode = findCountryCode(lat, lng);
  if (!countryCode) {
    return null;
  }

  const countryName = getCountryName(countryCode);

  const fromNominatim = await fetchFromNominatim(lat, lng, countryCode, countryName);
  if (fromNominatim) {
    return fromNominatim;
  }

  return {
    prefectureId: null,
    countryCode,
    placeName: countryName,
    confidence: 0.7,
    source: 'atlas'
  };
}
