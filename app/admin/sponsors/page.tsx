import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { mapSponsorRow } from '@/lib/api/themeTemplates';
import { AdminSponsorsClient } from '@/app/admin/sponsors/AdminSponsorsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSponsorsPage() {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase.from('sponsors').select('*').order('created_at', { ascending: false });

  return <AdminSponsorsClient sponsors={(data ?? []).map(mapSponsorRow)} />;
}
