/**
 * サムネイルの仕組みを入れる前にアップロードされた写真に、後からサムネイルを作る。
 *
 * 通常は使わない一回きりの道具。写真が数枚のうちは実行しなくても
 * （サムネイルが無い写真は表示用の画像で代用されるので）問題なく動く。
 * 枚数が増えてから入れた場合に、過去分をまとめて処理するために用意している。
 *
 * 使い方（プロジェクトのフォルダで）：
 *   npm install --no-save sharp dotenv
 *   node scripts/backfill-thumbnails.mjs
 *
 * .env.local の SUPABASE_SERVICE_ROLE_KEY を使うため、
 * 実行するのは自分のPCの中だけにすること（このキーはすべての権限を持つ）。
 */
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { config } from 'dotenv';

config({ path: '.env.local' });

const BUCKET = 'trip-photos';
const THUMBNAIL_MAX_EDGE = 480;
const THUMBNAIL_QUALITY = 70;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が .env.local に必要です');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const { data: photos, error } = await supabase
  .from('photos')
  .select('id, storage_path, thumbnail_path')
  .is('thumbnail_path', null);

if (error) {
  console.error('写真の一覧を取得できませんでした:', error.message);
  process.exit(1);
}

if (!photos || photos.length === 0) {
  console.log('サムネイルが無い写真はありません。処理するものはありません。');
  process.exit(0);
}

console.log(`${photos.length}枚を処理します`);

let done = 0;
let failed = 0;

for (const photo of photos) {
  try {
    const { data: file, error: downloadError } = await supabase.storage.from(BUCKET).download(photo.storage_path);
    if (downloadError || !file) {
      throw new Error(downloadError?.message ?? 'ダウンロードに失敗');
    }

    const original = Buffer.from(await file.arrayBuffer());
    const thumbnail = await sharp(original)
      .rotate() // EXIFの向き情報を反映してから縮小する
      .resize(THUMBNAIL_MAX_EDGE, THUMBNAIL_MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: THUMBNAIL_QUALITY })
      .toBuffer();

    // 保存先は「もとのパスの拡張子を外して -thumb.jpg」。アップロード時と同じ規則
    const thumbnailPath = `${photo.storage_path.replace(/\.[^.]+$/, '')}-thumb.jpg`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(thumbnailPath, thumbnail, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { error: updateError } = await supabase
      .from('photos')
      .update({ thumbnail_path: thumbnailPath })
      .eq('id', photo.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    done += 1;
    console.log(`  OK  ${photo.storage_path} → ${thumbnailPath}`);
  } catch (cause) {
    failed += 1;
    console.error(`  NG  ${photo.storage_path}: ${cause instanceof Error ? cause.message : cause}`);
  }
}

console.log(`\n完了: ${done}枚成功 / ${failed}枚失敗`);
