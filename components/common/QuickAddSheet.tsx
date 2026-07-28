'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ImagePlus, MapPin, Plus } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { formatDateRange } from '@/lib/format';
import { uploadPhotos } from '@/lib/api/uploadPhotos';
import type { Trip } from '@/types/app';

type QuickAddSheetProps = {
  open: boolean;
  onClose: () => void;
};

type Step = 'choose' | 'pickTrip';

export function QuickAddSheet({ onClose, open }: QuickAddSheetProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('choose');
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 開くたびに最初の状態へ戻す
  useEffect(() => {
    if (open) {
      setStep('choose');
      setSelectedTripId(null);
      setProgress(null);
      setError(null);
    }
  }, [open]);

  async function openTripPicker() {
    setStep('pickTrip');
    setError(null);

    if (trips !== null) {
      return;
    }

    setLoadingTrips(true);
    try {
      const response = await fetch('/api/trips');
      const data = (await response.json()) as { trips?: Trip[]; error?: string };

      if (!response.ok) {
        setError(data.error ?? '旅の読み込みに失敗しました。');
        return;
      }

      setTrips(data.trips ?? []);
    } catch {
      setError('通信に失敗しました。');
    } finally {
      setLoadingTrips(false);
    }
  }

  function chooseTrip(tripId: string) {
    setSelectedTripId(tripId);
    setError(null);
    // 旅を選んだらすぐ端末の写真選択を開く
    inputRef.current?.click();
  }

  async function handleFiles(files: File[]) {
    if (!selectedTripId || files.length === 0) {
      return;
    }

    setProgress({ done: 0, total: files.length });
    setError(null);

    const result = await uploadPhotos(selectedTripId, files, (done, total) => setProgress({ done, total }));

    setProgress(null);

    if (result.uploaded === 0) {
      setError(result.firstError ?? 'アップロードに失敗しました。');
      return;
    }

    onClose();
    router.push(`/trips/${selectedTripId}`);
    router.refresh();
  }

  const isUploading = progress !== null;

  return (
    <Modal
      closeOnOverlayClick={!isUploading}
      onClose={onClose}
      open={open}
      testId="quick-add-sheet"
      title={step === 'choose' ? '追加する' : '写真を追加する旅を選ぶ'}
    >
      <input
        accept="image/*"
        className="hidden"
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          void handleFiles(files);
        }}
        ref={inputRef}
        type="file"
      />

      {step === 'choose' ? (
        <div className="space-y-3">
          <button
            className="flex w-full items-center gap-3 rounded-lg border border-enadia-line bg-white p-4 text-left transition hover:border-enadia-primary"
            onClick={openTripPicker}
            type="button"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-teal-50 text-enadia-primary">
              <ImagePlus className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-enadia-ink">既存の旅に写真を追加</span>
              <span className="block text-xs text-enadia-muted">旅を選んで、まとめてアップロードします</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-enadia-muted" aria-hidden="true" />
          </button>

          <button
            className="flex w-full items-center gap-3 rounded-lg border border-enadia-line bg-white p-4 text-left transition hover:border-enadia-primary"
            onClick={() => {
              onClose();
              router.push('/trips/new');
            }}
            type="button"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-enadia-ink">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-enadia-ink">新しい旅をつくる</span>
              <span className="block text-xs text-enadia-muted">旅の名前や日程を決めて始めます</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-enadia-muted" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {isUploading ? (
            <p className="rounded-lg bg-teal-50 p-3 text-center text-sm font-bold text-enadia-primary">
              アップロード中… {progress.done} / {progress.total} 枚
            </p>
          ) : null}

          {loadingTrips ? <p className="py-6 text-center text-sm text-enadia-muted">読み込み中…</p> : null}

          {!loadingTrips && trips !== null && trips.length === 0 ? (
            <div className="rounded-lg border border-dashed border-enadia-line p-6 text-center">
              <p className="text-sm text-enadia-muted">まだ旅がありません。先に旅をつくりましょう。</p>
              <Button
                className="mx-auto mt-4"
                icon={<Plus className="h-4 w-4" aria-hidden="true" />}
                onClick={() => {
                  onClose();
                  router.push('/trips/new');
                }}
              >
                新しい旅をつくる
              </Button>
            </div>
          ) : null}

          {!loadingTrips && trips !== null && trips.length > 0
            ? trips.map((trip) => (
                <button
                  className="flex w-full items-center gap-3 rounded-lg border border-enadia-line bg-white p-3 text-left transition hover:border-enadia-primary disabled:opacity-50"
                  disabled={isUploading}
                  key={trip.id}
                  onClick={() => chooseTrip(trip.id)}
                  type="button"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-enadia-ink">{trip.title}</span>
                    <span className="block truncate text-xs text-enadia-muted">
                      {formatDateRange(trip.startsAt, trip.endsAt)}
                      {trip.area ? ` ・ ${trip.area}` : ''}
                    </span>
                  </span>
                  <ImagePlus className="h-5 w-5 shrink-0 text-enadia-muted" aria-hidden="true" />
                </button>
              ))
            : null}

          {error ? <p className="text-sm text-enadia-danger">{error}</p> : null}

          {!isUploading ? (
            <Button className="w-full" onClick={() => setStep('choose')} variant="secondary">
              戻る
            </Button>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
