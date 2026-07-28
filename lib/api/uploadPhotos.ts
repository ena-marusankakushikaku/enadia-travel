export type UploadResult = {
  uploaded: number;
  failed: number;
  /** 位置情報を自動で取得できた枚数 */
  located: number;
  firstError: string | null;
};

/**
 * 写真を1枚ずつ順番にアップロードする。
 * まとめて並列に送ると端末や回線が詰まりやすいので、あえて逐次で送る。
 * 途中で失敗しても残りは続行し、結果をまとめて返す。
 */
export async function uploadPhotos(
  tripId: string,
  files: File[],
  onProgress?: (done: number, total: number) => void
): Promise<UploadResult> {
  const result: UploadResult = { uploaded: 0, failed: 0, located: 0, firstError: null };

  for (const [index, file] of files.entries()) {
    const formData = new FormData();
    formData.append('tripId', tripId);
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-photo', { method: 'POST', body: formData });
      const data = (await response.json()) as { error?: string; locationDetected?: boolean };

      if (response.ok) {
        result.uploaded += 1;
        if (data.locationDetected) {
          result.located += 1;
        }
      } else {
        result.failed += 1;
        result.firstError = result.firstError ?? data.error ?? 'アップロードに失敗しました。';
      }
    } catch {
      result.failed += 1;
      result.firstError = result.firstError ?? '通信に失敗しました。';
    }

    onProgress?.(index + 1, files.length);
  }

  return result;
}
