import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { getAppSettingRows } from '@/lib/settings';
import { AdminSettingsClient } from '@/app/admin/settings/AdminSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const supabase = createSupabaseServiceClient();
  return <AdminSettingsClient settings={await getAppSettingRows(supabase)} />;
}
