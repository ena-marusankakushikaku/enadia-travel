import { resizeImage } from '@/lib/images/resizeImage';
import { extractPhotoExifFromFile } from '@/lib/geo/photoExifClient';

export type UploadResult = {
  uploaded: number;
  failed: number;
  /** 位置情報を自動で取得できた枚数 */
  located: number;
  /** 撮影日が写真に残っておらず、アップロード日時で代用した枚数 */
  undated: number;
  firstError: string | null;
};

/**
 * 写真を1枚ずつ順番にアップロードする。
 * まとめて並列に送ると端末や回線が詰まりやすいので、あえて逐次で送る。
 * 途中で失敗しても残りは続行し、結果をまとめて返す。
 *
 * 送る前にブラウザ側で2つの処理をしている。
 *
 * 1. EXIF（位置情報・撮影日時）の読み取り
 *    次の縮小でEXIFが消えるため、必ず先に読む。
 * 2. 画像の縮小
 *    表示用（長辺1600px）とサムネイル（長辺480px）を作る。
 *    原寸のまま扱うと、一覧を開くたびに何十MBもダウンロードすることになる。
 */
export async function uploadPhotos(
  tripId: string,
  files: File[],
  onProgress?: (done: number, total: number) => void
): Promise<UploadResult> {
  const result: UploadResult = { uploaded: 0, failed: 0, located: 0, undated: 0, firstError: null };

  for (const [index, file] of files.entries()) {
    try {
      // 縮小より先にEXIFを読む（順番を入れ替えると位置情報が失われる）
      const exif = await extractPhotoExifFromFile(file);
      const resized = await resizeImage(file);

      const formData = new FormData();
      formData.append('tripId', tripId);
      formData.append('file', resized?.display ?? file);

      if (resized) {
        formData.append('thumbnail', resized.thumbnail);
      }

      if (exif.lat !== null && exif.lng !== null) {
        formData.append('lat', String(exif.lat));
        formData.append('lng', String(exif.lng));
      }

      if (exif.capturedAt) {
        formData.append('capturedAt', exif.capturedAt);
      }

      const response = await fetch('/api/upload-photo', { method: 'POST', body: formData });
      const data = (await response.json()) as {
        error?: string;
        locationDetected?: boolean;
        capturedAtDetected?: boolean;
      };

      if (response.ok) {
        result.uploaded += 1;
        if (data.locationDetected) {
          result.located += 1;
        }
        if (data.capturedAtDetected === false) {
          result.undated += 1;
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
