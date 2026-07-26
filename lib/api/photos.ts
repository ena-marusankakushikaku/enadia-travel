import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import type { Photo, SuggestedTheme } from '@/types/app';

type PhotoRow = Database['public']['Tables']['photos']['Row'];

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
    // Reactions/comments are fetched separately by the photo feed once that screen migrates off mock data.
    reactions: [],
    comments: [],
    seenBy: []
  };
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
