import 'server-only';

import { createSupabaseServiceClient } from '@/lib/supabase/service';
import type { TourismEventType } from '@/types/app';
import type { Json } from '@/types/json';

type TourismEventPayload = {
  userId: string;
  tripId?: string;
  photoId?: string;
  conquestProjectId?: string;
  conquestEntryId?: string;
  prefectureId?: number;
  lat?: number;
  lng?: number;
  placeName?: string;
  metadata?: Record<string, unknown>;
};

export async function insertTourismEvent(
  eventType: TourismEventType,
  payload: TourismEventPayload
) {
  try {
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from('tourism_events').insert({
      event_type: eventType,
      user_id: payload.userId,
      trip_id: payload.tripId ?? null,
      photo_id: payload.photoId ?? null,
      conquest_project_id: payload.conquestProjectId ?? null,
      conquest_entry_id: payload.conquestEntryId ?? null,
      prefecture_id: payload.prefectureId ?? null,
      lat: payload.lat ?? null,
      lng: payload.lng ?? null,
      place_name: payload.placeName ?? null,
      metadata: (payload.metadata ?? {}) as Json
    });

    if (error) {
      console.error('tourism_events insert failed', error);
    }
  } catch (error) {
    console.error('tourism_events insert failed', error);
  }
}
