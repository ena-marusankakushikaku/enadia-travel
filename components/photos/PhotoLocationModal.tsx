'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, MapPin, Search } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { MAP_PREFECTURES } from '@/constants/japan';
import type { Photo } from '@/types/app';

type PhotoLocationModalProps = {
  photo: Photo | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

type PlaceCandidate = {
  title: string;
  lat: number;
  lng: number;
  prefectureId: number;
  prefectureName: string;
};

/** 入力のたびに検索すると無駄が多いので、打ち終わってから投げる */
const SEARCH_DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

export function PhotoLocationModal({ onClose, onSaved, open, photo }: PhotoLocationModalProps) {
  const [prefectureId, setPrefectureId] = useState<number | ''>('');
  const [placeName, setPlaceName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 候補から選んだときだけ入る。県庁所在地ではなく実際の場所にピンを置くために使う
  const [picked, setPicked] = useState<PlaceCandidate | null>(null);
  const [candidates, setCandidates] = useState<PlaceCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // 別の写真を開いたときに、その写真の現在値でフォームを初期化する
  useEffect(() => {
    setPrefectureId(photo?.prefectureId ?? '');
    setPlaceName(photo?.placeName ?? '');
    setPicked(null);
    setCandidates([]);
    setSearchFailed(false);
    setError(null);
  }, [photo]);

  // 地点名を打つと候補を探す。見つからなければ手入力のまま保存できる
  useEffect(() => {
    const query = placeName.trim();

    if (!open || picked !== null || query.length < MIN_QUERY_LENGTH) {
      setCandidates([]);
      setSearching(false);
      setSearchFailed(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSearching(true);
      try {
        const response = await fetch(`/api/place-search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        const data = (await response.json()) as { candidates?: PlaceCandidate[]; searched?: boolean };
        setCandidates(data.candidates ?? []);
        setSearchFailed(data.searched === false);
      } catch {
        // 中断はよくあることなので、静かに候補なしにする
        setCandidates([]);
      } finally {
        setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [open, picked, placeName]);

  function selectCandidate(candidate: PlaceCandidate) {
    setPicked(candidate);
    setPlaceName(candidate.title);
    setPrefectureId(candidate.prefectureId);
    setCandidates([]);
    setError(null);
  }

  async function save() {
    if (!photo || prefectureId === '') {
      setError('都道府県を選択してください。');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/photo-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId: photo.id,
          prefectureId,
          placeName,
          lat: picked?.lat ?? null,
          lng: picked?.lng ?? null
        })
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? '保存に失敗しました。');
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError('通信に失敗しました。時間をおいて試してください。');
    } finally {
      setSaving(false);
    }
  }

  const query = placeName.trim();
  const showNoMatch =
    picked === null && !searching && !searchFailed && query.length >= MIN_QUERY_LENGTH && candidates.length === 0;

  return (
    <Modal onClose={onClose} open={open} testId="photo-location-modal" title="場所を設定">
      <div className="space-y-4">
        <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-enadia-muted">
          写真に位置情報が無い場合は、ここで場所を設定できます。設定するとおもいでの地図と制覇マップに反映されます。
        </p>

        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">地点名</span>
          <div className="mt-2 flex items-center rounded-lg border border-enadia-line bg-white px-2">
            <Search className="h-4 w-4 shrink-0 text-enadia-muted" aria-hidden="true" />
            <input
              className="h-11 min-w-0 flex-1 px-2 text-sm outline-none"
              onChange={(event) => {
                setPlaceName(event.target.value);
                setPicked(null);
              }}
              placeholder="例：清水寺、横浜駅"
              value={placeName}
            />
          </div>

          {picked ? (
            <span className="mt-1.5 flex items-center gap-1 text-xs font-bold text-enadia-primary">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              地図上の位置が確定しました（{picked.prefectureName}）
            </span>
          ) : (
            <span className="mt-1.5 block text-xs text-enadia-muted">
              2文字以上で候補を探します。候補を選ぶと、地図のピンがその場所に立ちます。
            </span>
          )}
        </label>

        {searching ? <p className="text-xs text-enadia-muted">候補を探しています…</p> : null}

        {candidates.length > 0 ? (
          <ul className="max-h-52 overflow-y-auto rounded-lg border border-enadia-line">
            {candidates.map((candidate) => (
              <li className="border-b border-enadia-line last:border-b-0" key={`${candidate.title}-${candidate.lat}`}>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-slate-50"
                  onClick={() => selectCandidate(candidate)}
                  type="button"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-enadia-muted" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-enadia-ink">{candidate.title}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {showNoMatch ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
            「{query}」に一致する地名は見つかりませんでした。このまま保存もできますが、その場合は地図のピンが選んだ都道府県の中心に立ちます。
          </p>
        ) : null}

        {searchFailed ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-enadia-muted">
            いま地名を検索できませんでした。手入力のまま保存できます。
          </p>
        ) : null}

        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">都道府県</span>
          <select
            className="mt-2 h-11 w-full rounded-lg border border-enadia-line bg-white px-3 text-sm"
            onChange={(event) => {
              setPrefectureId(event.target.value === '' ? '' : Number(event.target.value));
              // 候補で決まった都道府県を手で変えたら、座標の確定も解除する
              setPicked(null);
            }}
            value={prefectureId}
          >
            <option value="">選択してください</option>
            {MAP_PREFECTURES.map((prefecture) => (
              <option key={prefecture.id} value={prefecture.id}>
                {prefecture.name}
              </option>
            ))}
          </select>
          <span className="mt-1.5 block text-xs text-enadia-muted">
            候補を選ぶと自動で入ります。地点名が空欄の場合は都道府県名が地点名になります。
          </span>
        </label>

        {error ? <p className="text-sm text-enadia-danger">{error}</p> : null}

        <div className="flex gap-2">
          <Button className="flex-1" onClick={onClose} variant="secondary">
            キャンセル
          </Button>
          <Button
            className="flex-1"
            icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
            loading={saving}
            onClick={save}
          >
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}
