import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';
import { MAP_PREFECTURES } from '@/constants/japan';
import { findNearestPrefectureId, isWithinJapanBounds } from '@/lib/geo/prefectureCoordinates';

/**
 * 地名を検索して候補を返す。
 *
 * 手入力の地点名は、存在しない地名でもそのまま保存できてしまい、
 * さらに座標が無いためピンが県庁所在地に置かれてしまう。
 * 候補から選べるようにすると、この2つが同時に解決する。
 *
 * 使うのは国土地理院の住所検索API（APIキー不要・無料）。
 * 位置情報の判定に使っている逆ジオコーディングAPIと同じ提供元なので、
 * 表記のゆれが起きにくい。
 *
 * このAPIが落ちていても手入力での保存はできるので、失敗は候補0件として返す。
 */
const GSI_SEARCH_ENDPOINT = 'https://msearch.gsi.go.jp/address-search/AddressSearch';
const TIMEOUT_MS = 5000;
const MAX_RESULTS = 8;

export type PlaceCandidate = {
  title: string;
  lat: number;
  lng: number;
  prefectureId: number;
  prefectureName: string;
};

type GsiFeature = {
  geometry?: { coordinates?: unknown } | null;
  properties?: { title?: unknown; addressCode?: unknown } | null;
};

/** 市区町村コードの先頭2桁が都道府県コード。取れなければ地名の頭、それも駄目なら座標から求める */
function resolvePrefectureId(addressCode: unknown, title: string, lat: number, lng: number): number | null {
  const digits = String(addressCode ?? '').replace(/[^0-9]/g, '');
  if (digits.length >= 4 && digits.length <= 5) {
    const fromCode = Number.parseInt(digits.padStart(5, '0').slice(0, 2), 10);
    if (fromCode >= 1 && fromCode <= 47) {
      return fromCode;
    }
  }

  const fromTitle = MAP_PREFECTURES.find((prefecture) => title.startsWith(prefecture.name));
  if (fromTitle) {
    return fromTitle.id;
  }

  return findNearestPrefectureId(lat, lng);
}

function toCandidate(feature: GsiFeature): PlaceCandidate | null {
  const coordinates = feature.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }

  // 国土地理院は [経度, 緯度] の順で返す
  const lng = Number(coordinates[0]);
  const lat = Number(coordinates[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isWithinJapanBounds(lat, lng)) {
    return null;
  }

  const title = typeof feature.properties?.title === 'string' ? feature.properties.title.trim() : '';
  if (!title) {
    return null;
  }

  const prefectureId = resolvePrefectureId(feature.properties?.addressCode, title, lat, lng);
  if (prefectureId === null) {
    return null;
  }

  return {
    title,
    lat,
    lng,
    prefectureId,
    prefectureName: MAP_PREFECTURES.find((prefecture) => prefecture.id === prefectureId)?.name ?? ''
  };
}

export async function GET(request: Request) {
  const { response, user } = await requireUser();
  if (response || !user) return response;

  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';

  if (query.length < 2) {
    return NextResponse.json({ candidates: [], searched: false });
  }

  try {
    const url = `${GSI_SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`;
    const gsiResponse = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    if (!gsiResponse.ok) {
      return NextResponse.json({ candidates: [], searched: false });
    }

    const data = (await gsiResponse.json()) as unknown;
    if (!Array.isArray(data)) {
      return NextResponse.json({ candidates: [], searched: false });
    }

    const candidates: PlaceCandidate[] = [];
    const seen = new Set<string>();

    for (const feature of data as GsiFeature[]) {
      const candidate = toCandidate(feature);
      if (!candidate || seen.has(candidate.title)) {
        continue;
      }
      seen.add(candidate.title);
      candidates.push(candidate);

      if (candidates.length >= MAX_RESULTS) {
        break;
      }
    }

    return NextResponse.json({ candidates, searched: true });
  } catch {
    // タイムアウトや通信エラーは「候補が出せなかった」として扱う。手入力は引き続きできる
    return NextResponse.json({ candidates: [], searched: false });
  }
}
