import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import type { Photo, PhotoComment, PhotoReaction, SuggestedTheme } from '@/types/app';

type PhotoRow = Database['public']['Tables']['photos']['Row'];
type PhotoReactionRow = Database['public']['Tables']['photo_reactions']['Row'];
type PhotoCommentRow = Database['public']['Tables']['photo_comments']['Row'];

const PHOTO_SIGNED_URL_TTL_SECONDS = 60 * 60;

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
  const paths = Array.from(new Set(photos.map((photo) => photo.storagePath)));
  if (paths.length === 0) {
    return photos;
  }

  const { data, error } = await supabase.storage.from('trip-photos').createSignedUrls(paths, PHOTO_SIGNED_URL_TTL_SECONDS);
  if (error || !data) {
    return photos;
  }

  const urlByPath = new Map(data.filter((entry) => entry.signedUrl).map((entry) => [entry.path, entry.signedUrl]));
  return photos.map((photo) => ({ ...photo, imageUrl: urlByPath.get(photo.storagePath) ?? null }));
}
