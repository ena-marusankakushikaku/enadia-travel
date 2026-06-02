import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth';

export async function GET() {
  const { response, supabase, user } = await requireUser();
  if (response || !user) return response;

  const { data, error } = await supabase
    .from('latest_user_consents')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ consents: data ?? [] });
}
