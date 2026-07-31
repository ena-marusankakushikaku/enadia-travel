'use client';

/**
 * 写真をブラウザ側で縮小してからアップロードする。
 *
 * これまではスマホで撮った原寸（3〜4MB）をそのまま保存し、表示のときも
 * その原寸をダウンロードしていた。3列グリッドの1枚は画面上で130ピクセル程度しかないので、
 * 実際に必要な大きさの100倍近いデータを毎回運んでいたことになる。
 *
 * ここで2種類を作る。
 * - 表示用（長辺1600px）：全画面で見るときに使う。原寸の代わりに保存する
 * - サムネイル（長辺480px）：一覧のグリッドで使う
 *
 * アップロードが速くなり、保存容量が減り、表示も速くなる。
 *
 * 注意：canvasで描き直すとEXIF（位置情報・撮影日時）が消える。
 * そのため呼び出し側で、縮小する前にEXIFを読み取っておく必要がある。
 */

export type ResizedImage = {
  display: File;
  thumbnail: File;
};

const DISPLAY_MAX_EDGE = 1600;
const THUMBNAIL_MAX_EDGE = 480;
const DISPLAY_QUALITY = 0.85;
const THUMBNAIL_QUALITY = 0.7;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('画像を読み込めませんでした'));
    };
    image.src = url;
  });
}

function drawResized(image: HTMLImageElement, maxEdge: number, quality: number): Promise<Blob | null> {
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    return Promise.resolve(null);
  }

  // 縮小時のギザギザを抑える
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}

function toFile(blob: Blob, name: string): File {
  return new File([blob], name, { type: 'image/jpeg' });
}

/** 元のファイル名から拡張子を外して、JPEG用の名前を作る */
function baseName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  return withoutExtension || 'photo';
}

/**
 * 表示用とサムネイルを作る。
 * 画像として読めない場合や、縮小に失敗した場合は null を返す（呼び出し側で原本を使う）。
 */
export async function resizeImage(file: File): Promise<ResizedImage | null> {
  try {
    const image = await loadImage(file);
    const [displayBlob, thumbnailBlob] = await Promise.all([
      drawResized(image, DISPLAY_MAX_EDGE, DISPLAY_QUALITY),
      drawResized(image, THUMBNAIL_MAX_EDGE, THUMBNAIL_QUALITY)
    ]);

    if (!displayBlob || !thumbnailBlob) {
      return null;
    }

    const name = baseName(file.name);

    // 縮小したのに元より大きくなる場合（すでに小さい画像など）は原本をそのまま使う
    const display = displayBlob.size < file.size ? toFile(displayBlob, `${name}.jpg`) : file;

    return {
      display,
      thumbnail: toFile(thumbnailBlob, `${name}-thumb.jpg`)
    };
  } catch {
    return null;
  }
}
