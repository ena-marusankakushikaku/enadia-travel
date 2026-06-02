import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';
import { insertTourismEvent } from '@/lib/tourism-events';

export async function POST(request: Request) {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const formData = await request.formData();
  const tripId = String(formData.get('tripId') ?? '');
  const file = formData.get('file');
  const caption = formData.get('caption');

  if (!tripId) {
    return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  const { data: roleData, error: roleError } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (roleError || !roleData || roleData.role === 'viewer') {
    return NextResponse.json({ error: 'editor role required' }, { status: 403 });
  }

  const extension = file.name.split('.').pop() ?? 'jpg';
  const storagePath = `${tripId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from('trip-photos')
    .upload(storagePath, file, { contentType: file.type || 'image/jpeg' });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: photo, error: insertError } = await supabase
    .from('photos')
    .insert({
      trip_id: tripId,
      uploaded_by: user.id,
      storage_path: storagePath,
      caption: typeof caption === 'string' ? caption : null,
      ai_processing_status: 'pending',
      suggested_themes: [],
      ai_tags: [],
      theme_entry_created: false
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await insertTourismEvent('photo_uploaded', {
    userId: user.id,
    tripId,
    photoId: photo.id,
    metadata: { storagePath }
  });

  return NextResponse.json({ photo }, { status: 201 });
}
