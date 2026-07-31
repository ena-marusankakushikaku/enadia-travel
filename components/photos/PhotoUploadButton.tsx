'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { uploadPhotos } from '@/lib/api/uploadPhotos';

type PhotoUploadButtonProps = {
  tripId: string;
  onUploaded?: () => void;
};

export function PhotoUploadButton({ onUploaded, tripId }: PhotoUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dateHint, setDateHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }

    setError(null);
    setMessage(null);
    setDateHint(null);
    setProgress({ done: 0, total: files.length });

    const result = await uploadPhotos(tripId, files, (done, total) => setProgress({ done, total }));

    setProgress(null);

    if (result.failed > 0) {
      setError(`${result.failed}枚のアップロードに失敗しました。${result.firstError ?? ''}`);
    }

    if (result.uploaded > 0) {
      setMessage(
        `${result.uploaded}枚を追加しました` +
          (result.located > 0 ? `（${result.located}枚に場所が入りました）` : '')
      );

      if (result.undated > 0) {
        setDateHint(
          `${result.undated}枚は撮影日が残っていないため、アップロード日で表示しています。写真を開いて「撮影日を修正」から、旅の何日目かを選べます。`
        );
      }

      onUploaded?.();
    }
  }

  const isUploading = progress !== null;

  return (
    <div className="space-y-1 text-right">
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
      <Button
        icon={<Upload className="h-4 w-4" aria-hidden="true" />}
        loading={isUploading}
        onClick={() => inputRef.current?.click()}
        size="sm"
        variant="secondary"
      >
        {isUploading ? `${progress.done} / ${progress.total} 枚` : '写真を追加'}
      </Button>
      {message ? <p className="text-xs text-enadia-primary">{message}</p> : null}
      {dateHint ? (
        <p className="rounded-lg bg-amber-50 px-2 py-1.5 text-left text-xs leading-relaxed text-amber-700">
          {dateHint}
        </p>
      ) : null}
      {error ? <p className="text-xs text-enadia-danger">{error}</p> : null}
    </div>
  );
}
