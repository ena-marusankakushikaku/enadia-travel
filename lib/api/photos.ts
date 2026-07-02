import type { Database } from '@/types/db';
import type { Photo, SuggestedTheme } from '@/types/app';

type PhotoRow = Database['public']['Tables']['photos']['Row'];

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
    // Reactions/comments are fetched separately by the photo feed once that screen migrates off mock data.
    reactions: [],
    comments: [],
    seenBy: []
  };
}
