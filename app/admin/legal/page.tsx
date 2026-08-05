import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { mapLegalDocumentRow } from '@/lib/legal';
import { AdminLegalClient } from '@/app/admin/legal/AdminLegalClient';

export const dynamic = 'force-dynamic';

export default async function AdminLegalPage() {
  const supabase = createSupabaseServiceClient();

  const { data } = await supabase
    .from('legal_documents')
    .select('*')
    .order('doc_type')
    .order('created_at', { ascending: false });

  return <AdminLegalClient documents={(data ?? []).map(mapLegalDocumentRow)} />;
}
