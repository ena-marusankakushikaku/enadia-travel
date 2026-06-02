'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/common/Button';

type PhotoUploadButtonProps = {
  tripId: string;
  onUploaded?: () => void;
};

export function PhotoUploadButton({ onUploaded, tripId }: PhotoUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('tripId', tripId);
    formData.append('file', file);

    const response = await fetch('/api/upload-photo', {
      method: 'POST',
      body: formData
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? 'アップロードに失敗しました。');
      return;
    }

    onUploaded?.();
  }

  return (
    <div className="space-y-1">
      <input
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
        ref={inputRef}
        type="file"
      />
      <Button
        icon={<Upload className="h-4 w-4" aria-hidden="true" />}
        loading={loading}
        onClick={() => inputRef.current?.click()}
        size="sm"
        variant="secondary"
      >
        実画像
      </Button>
      {error ? <p className="text-xs text-enadia-danger">{error}</p> : null}
    </div>
  );
}
