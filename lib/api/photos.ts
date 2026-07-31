import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import type { Photo, PhotoComment, PhotoReaction, SuggestedTheme } from '@/types/app';

type PhotoRow = Database['public']['Tables']['photos']['Row'];
type PhotoReactionRow = Database['public']['Tables']['photo_reactions']['Row'];
type PhotoCommentRow = Database['public']['Tables']['photo_comments']['Row'];

/**
 * 写真は非公開バケットに置いているので、表示のたびに期限付きのURLを発行している。
 *
 * 以前はこれを画面を開くたびに作り直していた。URLが毎回変わるということは、
 * ブラウザから見れば毎回別の画像なので、キャッシュがまったく効かず
 * 同じ写真を何度もダウンロードし直していた。
 *
 * 有効期限を4時間に延ばし、発行済みのURLをサーバー側で使い回すようにした。
 * 同じURLが返るので、2回目以降はブラウザが手元の画像をそのまま表示できる。
 *
 * 期限を延ばす分、URLが漏れたときに見られる時間も延びる。
 * 旅の写真という性質と、URL自体が推測できないことを踏まえて4時間としている。
 */
const PHOTO_SIGNED_URL_TTL_SECONDS = 4 * 60 * 60;

/** 期限切れの少し手前で作り直す（残り時間が短いURLを配らないため） */
const URL_CACHE_TTL_MS = 3 * 60 * 60 * 1000;

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * 保存先のパスから表示用URLを作る。すでに作ってあるものは使い回す。
 * 戻り値はパス→URLの対応表。
 */
export async function createSignedPhotoUrls(
  supabase: SupabaseClient<Database>,
  storagePaths: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const now = Date.now();
  const missing: string[] = [];

  for (const path of Array.from(new Set(storagePaths))) {
    const cached = signedUrlCache.get(path);
    if (cached && cached.expiresAt > now) {
      result.set(path, cached.url);
    } else {
      missing.push(path);
    }
  }

  if (missing.length === 0) {
    return result;
  }

  const { data, error } = await supabase.storage
    .from('trip-photos')
    .createSignedUrls(missing, PHOTO_SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    return result;
  }

  for (const entry of data) {
    if (!entry.signedUrl || !entry.path) {
      continue;
    }
    signedUrlCache.set(entry.path, { url: entry.signedUrl, expiresAt: now + URL_CACHE_TTL_MS });
    result.set(entry.path, entry.signedUrl);
  }

  return result;
}

export function mapPhotoRow(row: PhotoRow): Photo {
  return {
    id: row.id,
    tripId: row.trip_id,
    uploadedBy: row.uploaded_by,
    storagePath: row.storage_path,
    thumbnailPath: row.thumbnail_path,
    lat: row.lat,
    lng: row.lng,
    placeName: row.place_name,
    prefectureId: row.prefecture_id,
    confidence: row.confidence,
    aiTags: row.ai_tags,
    caption: row.caption,
    ts: row.captured_at ?? row.created_at,
    capturedAt: row.captured_at,
    suggestedThemes: (row.suggested_themes as unknown as SuggestedTheme[] | null) ?? [],
    aiProcessingStatus: row.ai_processing_status,
    themeEntryCreated: row.theme_entry_created,
    imageUrl: null,
    // いいね・コメントは attachPhotoInteractions で後から詰める
    reactions: [],
    comments: [],
    seenBy: []
  };
}

export function mapPhotoReactionRow(row: PhotoReactionRow): PhotoReaction {
  return {
    id: row.id,
    photoId: row.photo_id,
    userId: row.user_id,
    reactionType: row.reaction_type,
    createdAt: row.created_at
  };
}

export function mapPhotoCommentRow(row: PhotoCommentRow): PhotoComment {
  return {
    id: row.id,
    photoId: row.photo_id,
    userId: row.user_id,
    text: row.text,
    createdAt: row.created_at
  };
}

/**
 * 写真にいいね・コメントを紐づける。
 * お気に入り(heart)は本人だけのものなので、他人の分はここで取り除く
 * （DB側のRLSを強化していない環境でも、他人のお気に入りが画面に出ないようにするため）。
 */
export async function attachPhotoInteractions(
  supabase: SupabaseClient<Database>,
  photos: Photo[],
  currentUserId: string
): Promise<Photo[]> {
  const photoIds = photos.map((photo) => photo.id);
  if (photoIds.length === 0) {
    return photos;
  }

  const [{ data: reactionRows }, { data: commentRows }] = await Promise.all([
    supabase.from('photo_reactions').select('*').in('photo_id', photoIds),
    supabase.from('photo_comments').select('*').in('photo_id', photoIds).order('created_at', { ascending: true })
  ]);

  const reactionsByPhoto = new Map<string, PhotoReaction[]>();
  for (const row of reactionRows ?? []) {
    if (row.reaction_type === 'heart' && row.user_id !== currentUserId) {
      continue;
    }
    const list = reactionsByPhoto.get(row.photo_id) ?? [];
    list.push(mapPhotoReactionRow(row));
    reactionsByPhoto.set(row.photo_id, list);
  }

  const commentsByPhoto = new Map<string, PhotoComment[]>();
  for (const row of commentRows ?? []) {
    const list = commentsByPhoto.get(row.photo_id) ?? [];
    list.push(mapPhotoCommentRow(row));
    commentsByPhoto.set(row.photo_id, list);
  }

  return photos.map((photo) => ({
    ...photo,
    reactions: reactionsByPhoto.get(photo.id) ?? [],
    comments: commentsByPhoto.get(photo.id) ?? [],
    seenBy: (reactionsByPhoto.get(photo.id) ?? [])
      .filter((reaction) => reaction.reactionType === 'seen')
      .map((reaction) => reaction.userId)
  }));
}

// trip-photos is a private bucket, so rendering requires a signed URL rather than a public one.
export async function attachPhotoImageUrls(supabase: SupabaseClient<Database>, photos: Photo[]): Promise<Photo[]> {
  if (photos.length === 0) {
    return photos;
  }

  const urlByPath = await createSignedPhotoUrls(
    supabase,
    photos.map((photo) => photo.storagePath)
  );

  return photos.map((photo) => ({ ...photo, imageUrl: urlByPath.get(photo.storagePath) ?? null }));
}
